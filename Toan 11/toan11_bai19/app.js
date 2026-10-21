// ================================================================
// BÀI 19: LÔGARIT - TOÁN 11 KẾT NỐI TRI THỨC
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
  userTitle: 'Pháp Sư Biến Đổi Lôgarit',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// QUIZ DATA: 10 CÂU CHUẨN SGK TRANG 14 - 15
// ==========================================
const quizData = [
  {
    id: 1,
    title: "Câu 1 • SGK 6.9a: Tính giá trị lôgarit cơ bản",
    pts: 20,
    question: "Tính giá trị của biểu thức lôgarit: $P = \\log_2(2^{-13})$.",
    options: [
      { text: "$-13$", correct: true },
      { text: "$13$", correct: false },
      { text: "$2^{-13}$", correct: false },
      { text: "$\\frac{1}{13}$", correct: false }
    ],
    explanation: "Theo tính chất lôgarit của luỹ thừa: $\\log_a(a^\\alpha) = \\alpha$. Do đó $\\log_2(2^{-13}) = -13$."
  },
  {
    id: 2,
    title: "Câu 2 • SGK 6.9b: Tính lôgarit tự nhiên",
    pts: 20,
    question: "Tính giá trị của biểu thức lôgarit tự nhiên: $Q = \\ln(e^{\\sqrt{2}})$.",
    options: [
      { text: "$e$", correct: false },
      { text: "$\\sqrt{2}$", correct: true },
      { text: "$2$", correct: false },
      { text: "$\\frac{1}{\\sqrt{2}}$", correct: false }
    ],
    explanation: "Lôgarit tự nhiên $\\ln$ là lôgarit cơ số $e$. Áp dụng tính chất $\\ln(e^\\alpha) = \\alpha$, ta có $\\ln(e^{\\sqrt{2}}) = \\sqrt{2}$."
  },
  {
    id: 3,
    title: "Câu 3 • SGK 6.9c: Lôgarit của một thương",
    pts: 20,
    question: "Tính giá trị của hiệu hai lôgarit: $A = \\log_8 16 - \\log_8 2$.",
    options: [
      { text: "$1$", correct: true },
      { text: "$2$", correct: false },
      { text: "$0$", correct: false },
      { text: "$\\log_8 14$", correct: false }
    ],
    explanation: "Áp dụng quy tắc lôgarit của một thương: $\\log_a M - \\log_a N = \\log_a\\left(\\frac{M}{N}\\right)$.<br>Ta có: $A = \\log_8\\left(\\frac{16}{2}\\right) = \\log_8 8 = 1$."
  },
  {
    id: 4,
    title: "Câu 4 • SGK 6.9d: Tích hai lôgarit nối tiếp",
    pts: 20,
    question: "Tính giá trị của tích hai lôgarit: $B = \\log_2 6 \\cdot \\log_6 8$.",
    options: [
      { text: "$3$", correct: true },
      { text: "$4$", correct: false },
      { text: "$8$", correct: false },
      { text: "$\\log_2 14$", correct: false }
    ],
    explanation: "Theo hệ quả của công thức đổi cơ số: $\\log_a b \\cdot \\log_b c = \\log_a c$.<br>Do đó: $\\log_2 6 \\cdot \\log_6 8 = \\log_2 8 = \\log_2(2^3) = 3$."
  },
  {
    id: 5,
    title: "Câu 5 • SGK 6.10a: Viết gọn biểu thức lôgarit",
    pts: 20,
    question: "Viết biểu thức sau thành một lôgarit: $A = \\ln\\left(\\frac{x}{x-1}\\right) + \\ln\\left(\\frac{x+1}{x}\\right) - \\ln(x^2 - 1)$ (với $x > 1$).",
    options: [
      { text: "$\\ln\\left(\\frac{1}{(x-1)^2}\\right)$", correct: true },
      { text: "$\\ln(x^2 - 1)$", correct: false },
      { text: "$1$", correct: false },
      { text: "$0$", correct: false }
    ],
    explanation: "Áp dụng quy tắc cộng trừ lôgarit thành tích và thương:<br>$A = \\ln\\left[ \\frac{x}{x-1} \\cdot \\frac{x+1}{x} \\cdot \\frac{1}{x^2-1} \\right] = \\ln\\left[ \\frac{x+1}{(x-1)(x-1)(x+1)} \\right] = \\ln\\left[\\frac{1}{(x-1)^2}\\right] = -2\\ln(x-1)$."
  },
  {
    id: 6,
    title: "Câu 6 • SGK 6.10b: Rút gọn biểu thức lôgarit chứa căn",
    pts: 20,
    question: "Rút gọn biểu thức: $B = 21\\log_3\\sqrt[7]{x} + \\log_3(9x^2) - \\log_3 9$ (với $x > 0$).",
    options: [
      { text: "$5\\log_3 x$", correct: true },
      { text: "$3\\log_3 x$", correct: false },
      { text: "$23\\log_3 x$", correct: false },
      { text: "$7\\log_3 x$", correct: false }
    ],
    explanation: "Biến đổi từng số hạng:<br>• $21\\log_3\\sqrt[7]{x} = 21\\log_3(x^{\\frac{1}{7}}) = 21 \\cdot \\frac{1}{7}\\log_3 x = 3\\log_3 x$.<br>• $\\log_3(9x^2) - \\log_3 9 = \\log_3 9 + \\log_3(x^2) - \\log_3 9 = 2\\log_3 x$.<br>Cộng lại: $B = 3\\log_3 x + 2\\log_3 x = 5\\log_3 x$."
  },
  {
    id: 7,
    title: "Câu 7 • SGK 6.11a: Biến đổi về cùng cơ số nguyên tố",
    pts: 20,
    question: "Rút gọn biểu thức: $M = \\log_{\\frac{1}{3}} 5 + 2\\log_9 25 - \\log_{\\sqrt{3}}\\left(\\frac{1}{5}\\right)$.",
    options: [
      { text: "$3\\log_3 5$", correct: true },
      { text: "$\\log_3 5$", correct: false },
      { text: "$5\\log_3 5$", correct: false },
      { text: "$0$", correct: false }
    ],
    explanation: "Đưa tất cả về cơ số $3$:<br>• $\\log_{\\frac{1}{3}} 5 = \\log_{3^{-1}} 5 = -\\log_3 5$.<br>• $2\\log_9 25 = 2\\log_{3^2}(5^2) = 2 \\cdot \\frac{2}{2}\\log_3 5 = 2\\log_3 5$.<br>• $-\\log_{\\sqrt{3}}\\left(\\frac{1}{5}\\right) = -\\log_{3^{\\frac{1}{2}}}(5^{-1}) = -\\frac{-1}{1/2}\\log_3 5 = 2\\log_3 5$.<br>Cộng lại: $M = -\\log_3 5 + 2\\log_3 5 + 2\\log_3 5 = 3\\log_3 5$."
  },
  {
    id: 8,
    title: "Câu 8 • SGK 6.12a: Tích chuỗi lôgarit liên hoàn",
    pts: 20,
    question: "Tính giá trị tích liên hoàn: $T = \\log_2 3 \\cdot \\log_3 4 \\cdot \\log_4 5 \\cdot \\log_5 6 \\cdot \\log_6 7 \\cdot \\log_7 8$.",
    options: [
      { text: "$3$", correct: true },
      { text: "$4$", correct: false },
      { text: "$6$", correct: false },
      { text: "$8$", correct: false }
    ],
    explanation: "Áp dụng công thức chuỗi liên tiếp $\\log_a b \\cdot \\log_b c = \\log_a c$ cho toàn bộ tích:<br>$T = \\log_2 3 \\cdot \\log_3 4 \\cdots \\log_7 8 = \\log_2 8 = \\log_2(2^3) = 3$."
  },
  {
    id: 9,
    title: "Câu 9 • SGK 6.13: Áp suất không khí trên đỉnh Everest",
    pts: 20,
    question: "Công thức độ cao theo áp suất khí quyển là $a = 15500(5 - \\log p)$ (với $a$ tính bằng mét, $p$ tính bằng pascan). Biết đỉnh Everest có độ cao $a = 8850\\text{ m}$, áp suất không khí tại đây xấp xỉ bao nhiêu?",
    options: [
      { text: "Khoảng $26855\\text{ Pa}$", correct: true },
      { text: "Khoảng $18500\\text{ Pa}$", correct: false },
      { text: "Khoảng $35200\\text{ Pa}$", correct: false },
      { text: "Khoảng $101325\\text{ Pa}$", correct: false }
    ],
    explanation: "Thay $a = 8850$ vào công thức:<br>$8850 = 15500(5 - \\log p) \\implies 5 - \\log p = \\frac{8850}{15500} \\approx 0{,}570968$.<br>$\\implies \\log p = 5 - 0{,}570968 = 4{,}429032$.<br>$\\implies p = 10^{4{,}429032} \\approx 26855\\text{ Pa}$."
  },
  {
    id: 10,
    title: "Câu 10 • SGK 6.14: Mức cường độ âm Decibel cuộc trò chuyện",
    pts: 20,
    question: "Mức cường độ âm được định nghĩa $L(I) = 10\\log\\left(\\frac{I}{I_0}\\right)$ (dB) với ngưỡng nghe $I_0 = 10^{-12}\\text{ W/m}^2$. Cuộc trò chuyện bình thường có cường độ $I = 10^{-7}\\text{ W/m}^2$. Mức cường độ âm của cuộc trò chuyện là bao nhiêu?",
    options: [
      { text: "$50\\text{ dB}$", correct: true },
      { text: "$70\\text{ dB}$", correct: false },
      { text: "$35\\text{ dB}$", correct: false },
      { text: "$120\\text{ dB}$", correct: false }
    ],
    explanation: "Thay số vào công thức:<br>$L = 10\\log\\left(\\frac{10^{-7}}{10^{-12}}\\right) = 10\\log(10^{-7 - (-12)}) = 10\\log(10^5) = 10 \\times 5 = 50\\text{ dB}$."
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
// LAB 1: BÀN CÂN LÔGARIT HOÁN VỊ
// ==========================================
function initLab1() {
  const baseSlider = document.getElementById('logBaseSlider');
  const baseVal = document.getElementById('logBaseVal');
  const mSlider = document.getElementById('logMSlider');
  const mVal = document.getElementById('logMVal');
  const btnSnap = document.getElementById('btnSnapInteger');
  const canvas = document.getElementById('logScaleCanvas');
  const output = document.getElementById('logScaleOutput');
  if (!canvas || !baseSlider || !mSlider) return;

  const ctx = canvas.getContext('2d');

  function update() {
    const a = parseFloat(baseSlider.value);
    const M = parseFloat(mSlider.value);
    const alpha = Math.log(M) / Math.log(a);

    baseVal.textContent = a.toFixed(0);
    mVal.textContent = M.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0a0d1a');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Vẽ trụ bàn cân ở giữa (w/2, h - 60)
    const centerX = w / 2;
    const baseY = h - 60;

    ctx.fillStyle = '#475569';
    ctx.fillRect(centerX - 10, baseY - 140, 20, 140);

    // Đế cân
    ctx.beginPath();
    ctx.ellipse(centerX, baseY, 60, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();

    // Điểm chốt xoay (pivot)
    const pivotY = baseY - 140;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(centerX, pivotY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Thanh ngang bàn cân luôn thăng bằng (vì alpha = log_a M tương đương a^alpha = M)
    const armLen = 220;
    const leftX = centerX - armLen;
    const rightX = centerX + armLen;

    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(leftX, pivotY);
    ctx.lineTo(rightX, pivotY);
    ctx.stroke();

    // Dây treo đĩa cân
    const panDrop = 70;
    const panLeftY = pivotY + panDrop;
    const panRightY = pivotY + panDrop;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    // Dây đĩa trái
    ctx.beginPath();
    ctx.moveTo(leftX, pivotY);
    ctx.lineTo(leftX - 40, panLeftY);
    ctx.moveTo(leftX, pivotY);
    ctx.lineTo(leftX + 40, panLeftY);
    ctx.stroke();

    // Dây đĩa phải
    ctx.beginPath();
    ctx.moveTo(rightX, pivotY);
    ctx.lineTo(rightX - 40, panRightY);
    ctx.moveTo(rightX, pivotY);
    ctx.lineTo(rightX + 40, panRightY);
    ctx.stroke();

    // Đĩa cân trái (Đại diện cho luỹ thừa a^alpha)
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.ellipse(leftX, panLeftY, 50, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đĩa cân phải (Đại diện cho số M)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(rightX, panRightY, 50, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vật đặt trên đĩa trái: Khối luỹ thừa a^alpha
    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.fillRect(leftX - 35, panLeftY - 50, 70, 50);
    ctx.strokeRect(leftX - 35, panLeftY - 50, 70, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${a}^${alpha.toFixed(2)}`, leftX, panLeftY - 26);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`= ${Math.pow(a, alpha).toFixed(2)}`, leftX, panLeftY - 8);

    // Vật đặt trên đĩa phải: Khối giá trị M
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.fillRect(rightX - 35, panRightY - 50, 70, 50);
    ctx.strokeRect(rightX - 35, panRightY - 50, 70, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`M = ${M.toFixed(1)}`, rightX, panRightY - 26);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Số thực dương`, rightX, panRightY - 8);

    // Thước góc đo Lôgarit ở đỉnh
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`α = log_${a}(${M.toFixed(1)}) = ${alpha.toFixed(3)}`, centerX, 45);

    // Mũi tên hai chiều phản ánh tính hoán vị
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 80, 75);
    ctx.lineTo(centerX + 80, 75);
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Cơ chế tương đương 100%:  ${a}^α = M  ⟺  α = log_${a} M`, centerX, 105);

    output.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; line-height: 1.8;">
        <div><strong>Cơ số $a$:</strong> $${a}$</div>
        <div><strong>Giá trị $M$:</strong> $${M.toFixed(1)}$</div>
        <div><strong>Số mũ Lôgarit:</strong> $\\alpha = \\log_${a}(${M.toFixed(1)}) \\approx ${alpha.toFixed(4)}$</div>
        <div><strong>Kiểm chứng luỹ thừa:</strong> $${a}^{${alpha.toFixed(4)}} = ${Math.pow(a, alpha).toFixed(2)}$</div>
        <div><strong>Tính chất $a^{\\log_a M}$:</strong> $${a}^{\\log_${a}(${M.toFixed(1)})} = ${M.toFixed(1)}$</div>
        <div><strong>Tính chất $\\log_a(a^\\alpha)$:</strong> $\\log_${a}(${a}^{${alpha.toFixed(2)}}) = ${alpha.toFixed(2)}$</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(1);
  }

  baseSlider.addEventListener('input', () => { update(); sound.playClick(); });
  mSlider.addEventListener('input', () => { update(); sound.playClick(); });

  if (btnSnap) {
    btnSnap.addEventListener('click', () => {
      const a = parseFloat(baseSlider.value);
      // Snap to nearest integer power
      const curM = parseFloat(mSlider.value);
      const k = Math.round(Math.log(curM) / Math.log(a));
      const clampedK = Math.max(-1, Math.min(4, k));
      const newM = Math.pow(a, clampedK);
      mSlider.value = newM;
      update();
      sound.playClick();
    });
  }

  update();
}

// ==========================================
// LAB 2: MÁY ĐO MỨC CƯỜNG ĐỘ ÂM DECIBEL
// ==========================================
function initLab2() {
  const expSlider = document.getElementById('soundExpSlider');
  const expVal = document.getElementById('soundExpVal');
  const presetSelect = document.getElementById('soundPresetSelect');
  const canvas = document.getElementById('decibelCanvas');
  const output = document.getElementById('decibelOutput');
  if (!canvas || !expSlider) return;

  const ctx = canvas.getContext('2d');

  function update() {
    const x = parseInt(expSlider.value);
    expVal.textContent = x;

    const I = Math.pow(10, x);
    const I_0 = 1e-12;
    const L = 10 * (x - (-12)); // 10 * log10(10^(x+12)) = 10 * (x + 12)

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#080a14';
    ctx.fillRect(0, 0, w, h);

    // Thước đo Decibel hình cung tròn hoặc thanh đo nén
    // Vẽ đồng hồ đo áp lực âm
    const meterX = w / 2;
    const meterY = 220;
    const radius = 140;

    // Vành cung đo: từ -140 độ đến -40 độ (tương ứng 0 dB đến 140 dB)
    ctx.lineWidth = 20;
    // Vùng xanh lá an toàn: 0 - 70 dB
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(meterX, meterY, radius, Math.PI * 0.8, Math.PI * 1.3);
    ctx.stroke();

    // Vùng vàng cảnh báo: 70 - 100 dB
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(meterX, meterY, radius, Math.PI * 1.3, Math.PI * 1.7);
    ctx.stroke();

    // Vùng đỏ nguy hiểm: 100 - 140 dB
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(meterX, meterY, radius, Math.PI * 1.7, Math.PI * 2.2);
    ctx.stroke();

    // Kim chỉ Decibel
    const angle = Math.PI * 0.8 + (L / 140) * (Math.PI * 1.4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(meterX, meterY);
    ctx.lineTo(meterX + Math.cos(angle) * (radius - 15), meterY + Math.sin(angle) * (radius - 15));
    ctx.stroke();

    // Tâm kim
    ctx.fillStyle = '#818cf8';
    ctx.beginPath();
    ctx.arc(meterX, meterY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Nhãn số
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${L} dB`, meterX, meterY + 60);

    // Đánh giá mức độ
    let evalText = 'An toàn, êm dịu';
    let evalColor = '#10b981';
    if (L >= 120) {
      evalText = '⚠️ Nguy hiểm! Vượt ngưỡng đau tai';
      evalColor = '#ef4444';
    } else if (L >= 85) {
      evalText = '⚡ Ô nhiễm tiếng ồn, có hại cho thính giác';
      evalColor = '#f59e0b';
    }

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = evalColor;
    ctx.fillText(evalText, meterX, meterY + 90);

    // Đối sánh 2 thang đo: Năng lượng phi tuyến vs Thang đo Lôgarit tuyến tính
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Cường độ vật lí: I = 10^{${x}} W/m² (Chênh lệch: 10^{${x + 12}} lần ngưỡng nghe I_0)`, meterX, 50);

    output.innerHTML = `
      <div style="line-height: 1.8;">
        <div><strong>Cường độ âm thực tế:</strong> $I = 10^{${x}} \\text{ W/m}^2$ • <strong>Ngưỡng nghe chuẩn:</strong> $I_0 = 10^{-12} \\text{ W/m}^2$</div>
        <div><strong>Công thức tính:</strong> $L = 10\\log\\left(\\frac{10^{${x}}}{10^{-12}}\\right) = 10\\log(10^{${x + 12}}) = 10 \\times (${x + 12}) = ${L}\\text{ dB}$</div>
        <div style="color: #94a3b8; font-size: 13px;"><em>Nhận xét sư phạm:</em> Nếu không có phép toán Lôgarit nén dữ liệu, tai người sẽ phải xử lí thang đo năng lượng chênh lệch từ 1 đến 100.000.000.000.000 lần! Nhờ hàm số Lôgarit, thang đo được thu gọn tự nhiên về dải $0 - 140\\text{ dB}$.</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(2);
  }

  expSlider.addEventListener('input', () => {
    update();
    sound.playClick();
    if (presetSelect) presetSelect.value = expSlider.value;
  });

  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      expSlider.value = presetSelect.value;
      update();
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
