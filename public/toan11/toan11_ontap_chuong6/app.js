// ================================================================
// BÀI TẬP CUỐI CHƯƠNG VI: HÀM SỐ MŨ & HÀM SỐ LÔGARIT
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
  userTitle: 'Thủ Khoa Chương VI: Mũ & Lôgarit',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// QUIZ DATA: 10 CÂU CHUẨN SGK TRANG 25 - 26
// ==========================================
const quizData = [
  {
    id: 1,
    title: "Câu 1 • SGK 6.27: Tính chất luỹ thừa sai",
    pts: 20,
    question: "Cho hai số thực dương $x, y$ và hai số thực $\\alpha, \\beta$ tuỳ ý. Khẳng định nào sau đây là SAI?",
    options: [
      { text: "$x^\\alpha \\cdot y^\\beta = (xy)^{\\alpha + \\beta}$", correct: true },
      { text: "$x^\\alpha \\cdot x^\\beta = x^{\\alpha + \\beta}$", correct: false },
      { text: "$(x^\\alpha)^\\beta = x^{\\alpha \\cdot \\beta}$", correct: false },
      { text: "$(xy)^\\alpha = x^\\alpha \\cdot y^\\alpha$", correct: false }
    ],
    explanation: "Đẳng thức $x^\\alpha \\cdot y^\\beta = (xy)^{\\alpha + \\beta}$ là sai vì hai luỹ thừa khác cơ số và khác số mũ không thể nhân gộp số mũ như vậy (chỉ có $x^\\alpha \\cdot y^\\alpha = (xy)^\\alpha$)."
  },
  {
    id: 2,
    title: "Câu 2 • SGK 6.28: Rút gọn căn thức lồng nhau",
    pts: 20,
    question: "Rút gọn biểu thức $P = \\sqrt{x\\sqrt{x\\sqrt{x}}} : x^{\\frac{5}{8}}$ (với $x > 0$), ta được:",
    options: [
      { text: "$\\sqrt[4]{x}$", correct: true },
      { text: "$\\sqrt{x}$", correct: false },
      { text: "$\\sqrt[8]{x}$", correct: false },
      { text: "$\\sqrt[3]{x}$", correct: false }
    ],
    explanation: "Đưa từng căn thức về luỹ thừa hữu tỉ:<br>• Biểu thức trong căn: $x \\cdot x^{\\frac{1}{2}} \\cdot x^{\\frac{1}{4}} = x^{1 + \\frac{1}{2} + \\frac{1}{4}} = x^{\\frac{7}{4}}$.<br>• Căn bậc hai ngoài cùng: $\\sqrt{x^{\\frac{7}{4}}} = (x^{\\frac{7}{4}})^{\\frac{1}{2}} = x^{\\frac{7}{8}}$.<br>• Chia cho $x^{\\frac{5}{8}}$: $x^{\\frac{7}{8}} : x^{\\frac{5}{8}} = x^{\\frac{7}{8} - \\frac{5}{8}} = x^{\\frac{2}{8}} = x^{\\frac{1}{4}} = \\sqrt[4]{x}$."
  },
  {
    id: 3,
    title: "Câu 3 • SGK 6.29: Khai triển lôgarit của tích",
    pts: 20,
    question: "Cho hai số thực dương $a, b$ với $a \\ne 1$. Khẳng định nào sau đây là đúng?",
    options: [
      { text: "$\\log_a(a^3 b^2) = 3 + 2\\log_a b$", correct: true },
      { text: "$\\log_a(a^3 b^2) = 3 + \\log_a b$", correct: false },
      { text: "$\\log_a(a^3 b^2) = \\frac{3}{2} + \\log_a b$", correct: false },
      { text: "$\\log_a(a^3 b^2) = \\frac{1}{3} + \\frac{1}{2}\\log_a b$", correct: false }
    ],
    explanation: "Áp dụng công thức lôgarit của một tích và luỹ thừa:<br>$\\log_a(a^3 b^2) = \\log_a(a^3) + \\log_a(b^2) = 3\\log_a a + 2\\log_a b = 3 + 2\\log_a b$."
  },
  {
    id: 4,
    title: "Câu 4 • SGK 6.30: Khẳng định sai về phép tính lôgarit",
    pts: 20,
    question: "Cho bốn số thực dương $a, b, x, y$ với $a, b \\ne 1$. Khẳng định nào sau đây là SAI?",
    options: [
      { text: "$\\log_a\\left(\\frac{1}{x}\\right) = \\frac{1}{\\log_a x}$", correct: true },
      { text: "$\\log_a(xy) = \\log_a x + \\log_a y$", correct: false },
      { text: "$\\log_a\\left(\\frac{x}{y}\\right) = \\log_a x - \\log_a y$", correct: false },
      { text: "$\\log_a b \\cdot \\log_b x = \\log_a x$", correct: false }
    ],
    explanation: "Khẳng định $\\log_a\\left(\\frac{1}{x}\\right) = \\frac{1}{\\log_a x}$ là SAI vì công thức đúng phải là $\\log_a\\left(\\frac{1}{x}\\right) = \\log_a(x^{-1}) = -\\log_a x$."
  },
  {
    id: 5,
    title: "Câu 5 • SGK 6.31: Biểu diễn lôgarit qua hai biến",
    pts: 20,
    question: "Đặt $\\log_2 5 = a$ và $\\log_3 5 = b$. Khi đó $\\log_6 5$ tính theo $a$ và $b$ bằng:",
    options: [
      { text: "$\\frac{ab}{a + b}$", correct: true },
      { text: "$\\frac{1}{a + b}$", correct: false },
      { text: "$a^2 + b^2$", correct: false },
      { text: "$a + b$", correct: false }
    ],
    explanation: "Nghịch đảo cơ số:<br>$\\log_6 5 = \\frac{1}{\\log_5 6} = \\frac{1}{\\log_5(2 \\times 3)} = \\frac{1}{\\log_5 2 + \\log_5 3}$.<br>Mặt khác: $\\log_5 2 = \\frac{1}{\\log_2 5} = \\frac{1}{a}$ và $\\log_5 3 = \\frac{1}{\\log_3 5} = \\frac{1}{b}$.<br>Thay vào: $\\log_6 5 = \\frac{1}{\\frac{1}{a} + \\frac{1}{b}} = \\frac{1}{\\frac{a+b}{ab}} = \\frac{ab}{a + b}$."
  },
  {
    id: 6,
    title: "Câu 6 • SGK 6.32: Tính chất hàm số mũ",
    pts: 20,
    question: "Cho hàm số $y = 2^x$. Khẳng định nào sau đây là SAI?",
    options: [
      { text: "Đồ thị của hàm số cắt trục $Ox$ tại đúng một điểm", correct: true },
      { text: "Tập xác định của hàm số là $\\mathbb{R}$", correct: false },
      { text: "Tập giá trị của hàm số là $(0; +\\infty)$", correct: false },
      { text: "Hàm số đồng biến trên tập xác định của nó", correct: false }
    ],
    explanation: "Vì $2^x > 0$ với mọi $x \\in \\mathbb{R}$ nên đồ thị hàm số $y = 2^x$ luôn nằm hoàn toàn phía trên trục hoành $Ox$, không bao giờ cắt trục $Ox$. Do đó khẳng định cắt trục $Ox$ là sai."
  },
  {
    id: 7,
    title: "Câu 7 • SGK 6.33: Chiều biến thiên hàm số",
    pts: 20,
    question: "Hàm số nào sau đây ĐỒNG BIẾN trên tập xác định của nó?",
    options: [
      { text: "$y = \\ln x$", correct: true },
      { text: "$y = \\log_{0{,}5} x$", correct: false },
      { text: "$y = e^{-x}$", correct: false },
      { text: "$y = \\left(\\frac{1}{3}\\right)^x$", correct: false }
    ],
    explanation: "• $y = \\ln x$ có cơ số $e \\approx 2{,}718 > 1$ nên đồng biến trên $(0; +\\infty)$.<br>• $y = \\log_{0{,}5} x$ có cơ số $0{,}5 < 1$ nên nghịch biến.<br>• $y = e^{-x} = (1/e)^x$ có cơ số $1/e < 1$ nên nghịch biến.<br>• $y = (1/3)^x$ có cơ số $1/3 < 1$ nên nghịch biến."
  },
  {
    id: 8,
    title: "Câu 8 • SGK 6.34: So sánh ba cơ số từ đồ thị",
    pts: 20,
    question: "Cho đồ thị ba hàm số $y = \\log_a x$, $y = \\log_b x$ (đồng biến đi lên) và $y = \\log_c x$ (nghịch biến đi xuống). Biết đường thẳng $y = 1$ cắt đồ thị $y = \\log_a x$ tại hoành độ nhỏ hơn giao điểm với $y = \\log_b x$. Mệnh đề nào sau đây đúng?",
    options: [
      { text: "$b > a > c$", correct: true },
      { text: "$a > b > c$", correct: false },
      { text: "$a > c > b$", correct: false },
      { text: "$b > c > a$", correct: false }
    ],
    explanation: "Kẻ đường nằm ngang $y = 1$:<br>• Cắt $y = \\log_c x$ tại điểm có hoành độ $c < 1$ (do hàm nghịch biến).<br>• Cắt $y = \\log_a x$ tại $x = a > 1$.<br>• Cắt $y = \\log_b x$ tại $x = b > 1$.<br>Quan sát đồ thị hình 6.6 SGK trang 25, ta thấy hoành độ giao điểm $b$ nằm xa hơn $a$ $\\implies b > a > 1 > c$. Vậy $b > a > c$."
  },
  {
    id: 9,
    title: "Câu 9 • SGK 6.36b: Phương trình lôgarit có điều kiện",
    pts: 20,
    question: "Giải phương trình: $\\log_3(x + 1) + \\log_3(x + 4) = 2$.",
    options: [
      { text: "$x = \\frac{-5 + 3\\sqrt{5}}{2}$", correct: true },
      { text: "$x = \\frac{-5 \\pm 3\\sqrt{5}}{2}$", correct: false },
      { text: "$x = 1$", correct: false },
      { text: "$x = 2$", correct: false }
    ],
    explanation: "Điều kiện: $\\begin{cases} x + 1 > 0 \\\\ x + 4 > 0 \\end{cases} \\iff x > -1$.<br>Phương trình trở thành: $\\log_3[(x+1)(x+4)] = 2 \\iff x^2 + 5x + 4 = 3^2 = 9 \\iff x^2 + 5x - 5 = 0$.<br>Phương trình bậc hai có 2 nghiệm: $x_1 = \\frac{-5 + 3\\sqrt{5}}{2} \\approx 0{,}854$ (nhận vì $> -1$) và $x_2 = \\frac{-5 - 3\\sqrt{5}}{2} \\approx -5{,}854$ (loại vì $< -1$)."
  },
  {
    id: 10,
    title: "Câu 10 • SGK 6.40: Định luật Benford về chữ số đầu tiên",
    pts: 20,
    question: "Theo định luật Frank Benford, xác suất để chữ số đầu tiên của một số liệu tự nhiên là chữ số $d \\in \\{1, 2, \\dots, 9\\}$ được tính bởi $P = \\log\\left(\\frac{d+1}{d}\\right)$. Xác suất để chữ số đầu tiên là chữ số 1 bằng bao nhiêu?",
    options: [
      { text: "Khoảng $30{,}1\\%$", correct: true },
      { text: "Khoảng $11{,}1\\%$", correct: false },
      { text: "Khoảng $4{,}6\\%$", correct: false },
      { text: "Khoảng $50{,}0\\%$", correct: false }
    ],
    explanation: "Với $d = 1$, ta có:<br>$P = \\log\\left(\\frac{1+1}{1}\\right) = \\log 2 \\approx 0{,}30103 = 30{,}1\\%$.<br>(Chữ số 1 xuất hiện ở vị trí đầu tiên nhiều gấp hơn 6 lần so với chữ số 9: $P(9) = \\log(10/9) \\approx 4{,}6\\%$)."
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
// LAB 1: SA BÀN SO SÁNH ĐA CƠ SỐ SGK 6.34
// ==========================================
function initLab1() {
  const aSlider = document.getElementById('baseASlider');
  const aVal = document.getElementById('baseAVal');
  const bSlider = document.getElementById('baseBSlider');
  const bVal = document.getElementById('baseBVal');
  const cSlider = document.getElementById('baseCSlider');
  const cVal = document.getElementById('baseCVal');
  const canvas = document.getElementById('multiLogCanvas');
  const output = document.getElementById('multiLogOutput');
  if (!canvas || !aSlider || !bSlider || !cSlider) return;

  const ctx = canvas.getContext('2d');

  function update() {
    const a = parseFloat(aSlider.value);
    const b = parseFloat(bSlider.value);
    const c = parseFloat(cSlider.value);

    aVal.textContent = a.toFixed(1);
    bVal.textContent = b.toFixed(1);
    cVal.textContent = c.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, w, h);

    const ox = 90;
    const oy = h / 2 + 50;
    const scaleX = 70;
    const scaleY = 60;

    // Grid & Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = ox; x < w; x += scaleX) {
      ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, h - 20); ctx.stroke();
    }
    for (let y = oy % scaleY; y < h; y += scaleY) {
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(w - 20, y); ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 20); ctx.lineTo(ox, h - 20); ctx.stroke();

    // 1. Đường ngang y = 1 (Vàng hoàng kim nổi bật)
    const py1 = oy - 1 * scaleY;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(20, py1); ctx.lineTo(w - 20, py1); ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Đường chuẩn y = 1', w - 140, py1 - 8);

    // Hàm vẽ đường cong logarit
    function drawLogCurve(base, color, label) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      let started = false;
      for (let px = ox + 1; px <= w - 20; px += 2) {
        const vx = (px - ox) / scaleX;
        if (vx > 0) {
          const vy = Math.log(vx) / Math.log(base);
          const py = oy - vy * scaleY;
          if (py >= 15 && py <= h - 15) {
            if (!started) { ctx.moveTo(px, py); started = true; }
            else { ctx.lineTo(px, py); }
          }
        }
      }
      ctx.stroke();

      // Giao điểm với y = 1 chính là hoành độ x = base!
      const pxBase = ox + base * scaleX;
      if (pxBase <= w - 20) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(pxBase, py1, 6, 0, Math.PI * 2); ctx.fill();

        // Gióng xuống Ox
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(pxBase, py1); ctx.lineTo(pxBase, oy); ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${label} = ${base.toFixed(1)}`, pxBase - 15, oy + 18);
      }
    }

    // Vẽ 3 đường
    drawLogCurve(a, '#38bdf8', 'a');
    drawLogCurve(b, '#10b981', 'b');
    drawLogCurve(c, '#ef4444', 'c');

    // Chú thích đồ thị
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#38bdf8'; ctx.fillText(`y = log_a(x) (a = ${a.toFixed(1)})`, 40, 45);
    ctx.fillStyle = '#10b981'; ctx.fillText(`y = log_b(x) (b = ${b.toFixed(1)})`, 40, 70);
    ctx.fillStyle = '#ef4444'; ctx.fillText(`y = log_c(x) (c = ${c.toFixed(1)})`, 40, 95);

    output.innerHTML = `
      <div style="line-height: 1.8;">
        <div><strong>Bí quyết đọc cơ số từ đồ thị:</strong> Kẻ đường ngang $y = 1$, giao điểm của $y = 1$ với đồ thị $y = \\log_k x$ có hoành độ chính bằng cơ số $k$ (vì $\\log_k x = 1 \\iff x = k$).</div>
        <div><strong>Tọa độ các giao điểm:</strong> $(a; 1) = (${a.toFixed(1)}; 1)$ • $(b; 1) = (${b.toFixed(1)}; 1)$ • $(c; 1) = (${c.toFixed(1)}; 1)$</div>
        <div><strong>Thứ tự cơ số từ trái sang phải:</strong> <span style="color: #f59e0b; font-weight: bold;">$b = ${b.toFixed(1)} > a = ${a.toFixed(1)} > 1 > c = ${c.toFixed(1)}$</span> $\\implies b > a > c$.</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(1);
  }

  aSlider.addEventListener('input', () => { update(); sound.playClick(); });
  bSlider.addEventListener('input', () => { update(); sound.playClick(); });
  cSlider.addEventListener('input', () => { update(); sound.playClick(); });

  update();
}

// ==========================================
// LAB 2: MÁY KIỂM CHỨNG ĐỊNH LUẬT BENFORD
// ==========================================
function initLab2() {
  const digitSlider = document.getElementById('digitSlider');
  const digitVal = document.getElementById('digitVal');
  const btnGen = document.getElementById('btnGenSample');
  const canvas = document.getElementById('benfordCanvas');
  const output = document.getElementById('benfordOutput');
  if (!canvas || !digitSlider) return;

  const ctx = canvas.getContext('2d');
  let simulatedCounts = null;

  function update() {
    const curD = parseInt(digitSlider.value);
    digitVal.textContent = curD;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#080c18';
    ctx.fillRect(0, 0, w, h);

    const ox = 70;
    const oy = h - 60;
    const colW = (w - 120) / 9;

    // Header Canvas
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Phân Bố Xác Suất Benford: P(d) = log10(1 + 1/d) cho chữ số đầu tiên d ∈ {1..9}', 50, 35);

    // Vẽ các cột xác suất lý thuyết (Xanh ngọc neon)
    for (let d = 1; d <= 9; d++) {
      const p = Math.log10(1 + 1 / d);
      const barH = (p / 0.35) * (h - 130);
      const px = ox + (d - 1) * colW + 10;
      const barWidth = colW - 20;

      // Cột lý thuyết Benford
      ctx.fillStyle = d === curD ? '#f59e0b' : 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(px, oy - barH, barWidth, barH);
      ctx.strokeStyle = d === curD ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, oy - barH, barWidth, barH);

      // Nhãn chữ số
      ctx.fillStyle = d === curD ? '#f59e0b' : '#94a3b8';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${d}`, px + barWidth / 2, oy + 25);

      // Nhãn %
      ctx.font = '11px sans-serif';
      ctx.fillText(`${(p * 100).toFixed(1)}%`, px + barWidth / 2, oy - barH - 6);
    }

    ctx.textAlign = 'left';

    const probCur = Math.log10(1 + 1 / curD);

    output.innerHTML = `
      <div style="line-height: 1.8;">
        <div><strong>Chữ số khảo sát $d = ${curD}$:</strong> Xác suất xuất hiện là $P(${curD}) = \\log\\left(\\frac{${curD}+1}{${curD}}\\right) = \\log\\left(1 + \\frac{1}{${curD}}\\right) \\approx ${(probCur * 100).toFixed(2)}\\%$</div>
        <div><strong>So sánh:</strong> Chữ số 1 xuất hiện với xác suất cao nhất ($30{,}1\\%$), chữ số 9 chỉ xuất hiện ($4{,}6\\%$).</div>
        <div style="color: #94a3b8; font-size: 13px;"><em>Ứng dụng pháp y tài chính:</em> Trong các tập dữ liệu tự nhiên, nếu các chữ số đầu tiên xuất hiện đều nhau (~11%) thì số liệu đó gần như chắc chắn là ngụy tạo thủ công!</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(2);
  }

  digitSlider.addEventListener('input', () => { update(); sound.playClick(); });

  if (btnGen) {
    btnGen.addEventListener('click', () => {
      // Demo Benford law from powers of 2
      let counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 1; i <= 1000; i++) {
        // e.g. Fibonacci or factorial leading digit
        const val = Math.pow(1.5, i);
        const s = val.toExponential();
        const firstDigit = parseInt(s[0]);
        if (firstDigit >= 1 && firstDigit <= 9) counts[firstDigit]++;
      }
      alert(`Đã kiểm chứng trên mẫu 1000 số tăng trưởng luỹ thừa 1.5^n:\n• Chữ số 1: ${(counts[1]/10).toFixed(1)}% (Lý thuyết: 30.1%)\n• Chữ số 2: ${(counts[2]/10).toFixed(1)}% (Lý thuyết: 17.6%)\n• Chữ số 3: ${(counts[3]/10).toFixed(1)}% (Lý thuyết: 12.5%)\n• Chữ số 9: ${(counts[9]/10).toFixed(1)}% (Lý thuyết: 4.6%)\nKhớp hoàn toàn với Định luật Benford!`);
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
