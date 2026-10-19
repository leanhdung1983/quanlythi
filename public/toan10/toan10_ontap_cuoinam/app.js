// ========================================================
// TOÁN 10 - ÔN TẬP CUỐI NĂM: TỔNG KẾT TOÀN DIỆN
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Thủ Khoa Toán 10 KNTT',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  activeVertex: 'O',
  vectorAngle: 0,
  isAnimatingVector: false
};

// --- WEB AUDIO API SOUND SYNTHESIS ---
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'levelup') {
      const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.09);
        gain.gain.setValueAtTime(0.22, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.3);
      });
    } else if (type === 'fanfare') {
      const melody = [
        { f: 523.25, t: 0.0, d: 0.15 },
        { f: 659.25, t: 0.15, d: 0.15 },
        { f: 783.99, t: 0.3, d: 0.2 },
        { f: 1046.5, t: 0.5, d: 0.45 }
      ];
      melody.forEach(item => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, now + item.t);
        gain.gain.setValueAtTime(0.25, now + item.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + item.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + item.t);
        osc.stop(now + item.t + item.d);
      });
    }
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

// --- MATHML FALLBACK PARSER ---
function latexToMathML(latex) {
  let clean = latex.trim();
  const placeholders = [];

  function savePlaceholder(html) {
    const key = `\uE000${placeholders.length}\uE001`;
    placeholders.push(html);
    return key;
  }

  // Multi-letter stretchy vectors
  clean = clean.replace(/\\overrightarrow\{([^}]+)\}/g, (match, p1) => {
    return savePlaceholder(`<mover accent="true"><mrow>${latexToMathML(p1)}</mrow><mo>&#8594;</mo></mover>`);
  });

  // Stretchy vectors fallback \vec
  clean = clean.replace(/\\vec\{([^}]+)\}/g, (match, p1) => {
    return savePlaceholder(`<mover accent="true"><mrow>${latexToMathML(p1)}</mrow><mo>&#8594;</mo></mover>`);
  });

  // Fractions
  clean = clean.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (match, num, den) => {
    return savePlaceholder(`<mfrac><mrow>${latexToMathML(num)}</mrow><mrow>${latexToMathML(den)}</mrow></mfrac>`);
  });

  // Square roots
  clean = clean.replace(/\\sqrt\{([^{}]+)\}/g, (match, inner) => {
    return savePlaceholder(`<msqrt><mrow>${latexToMathML(inner)}</mrow></msqrt>`);
  });

  // Overlines
  clean = clean.replace(/\\overline\{([^}]+)\}/g, (match, inner) => {
    return savePlaceholder(`<mover accent="true"><mrow>${latexToMathML(inner)}</mrow><mo>&macr;</mo></mover>`);
  });

  // Subscripts & Superscripts
  clean = clean.replace(/([A-Za-z0-9\uE000-\uE001]+)\^\{([^}]+)\}/g, (match, base, exp) => {
    return savePlaceholder(`<msup><mrow>${base}</mrow><mrow>${latexToMathML(exp)}</mrow></msup>`);
  });
  clean = clean.replace(/([A-Za-z0-9\uE000-\uE001]+)_\{([^}]+)\}/g, (match, base, sub) => {
    return savePlaceholder(`<msub><mrow>${base}</mrow><mrow>${latexToMathML(sub)}</mrow></msub>`);
  });
  clean = clean.replace(/([A-Za-z0-9\uE000-\uE001]+)\^([0-9a-zA-Z])/g, (match, base, exp) => {
    return savePlaceholder(`<msup><mrow>${base}</mrow><mrow>${exp}</mrow></msup>`);
  });
  clean = clean.replace(/([A-Za-z0-9\uE000-\uE001]+)_([0-9a-zA-Z])/g, (match, base, sub) => {
    return savePlaceholder(`<msub><mrow>${base}</mrow><mrow>${sub}</mrow></msub>`);
  });

  // Common symbols
  clean = clean.replace(/\\Omega/g, savePlaceholder('<mi>&Omega;</mi>'));
  clean = clean.replace(/\\Delta/g, savePlaceholder('<mi>&Delta;</mi>'));
  clean = clean.replace(/\\delta/g, savePlaceholder('<mi>&delta;</mi>'));
  clean = clean.replace(/\\times/g, savePlaceholder('<mo>&times;</mo>'));
  clean = clean.replace(/\\le/g, savePlaceholder('<mo>&le;</mo>'));
  clean = clean.replace(/\\ge/g, savePlaceholder('<mo>&ge;</mo>'));
  clean = clean.replace(/\\ne/g, savePlaceholder('<mo>&ne;</mo>'));
  clean = clean.replace(/\\approx/g, savePlaceholder('<mo>&approx;</mo>'));
  clean = clean.replace(/\\pm/g, savePlaceholder('<mo>&plusmn;</mo>'));
  clean = clean.replace(/\\in/g, savePlaceholder('<mo>&isin;</mo>'));
  clean = clean.replace(/\\subset/g, savePlaceholder('<mo>&sub;</mo>'));
  clean = clean.replace(/\\cup/g, savePlaceholder('<mo>&cup;</mo>'));
  clean = clean.replace(/\\cap/g, savePlaceholder('<mo>&cap;</mo>'));
  clean = clean.replace(/\\varnothing/g, savePlaceholder('<mi>&empty;</mi>'));
  clean = clean.replace(/\\mathbb\{R\}/g, savePlaceholder('<mi>&#8477;</mi>'));
  clean = clean.replace(/\\mathbb\{N\}/g, savePlaceholder('<mi>&#8469;</mi>'));
  clean = clean.replace(/\\mathbb\{Z\}/g, savePlaceholder('<mi>&#8484;</mi>'));

  // Restore placeholders
  let result = clean;
  for (let i = 0; i < placeholders.length; i++) {
    result = result.replace(`\uE000${i}\uE001`, placeholders[i]);
  }

  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${result}</math>`;
}

function formatMathText(text) {
  if (!text) return '';
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      if (typeof katex !== 'undefined') {
        try {
          return katex.renderToString(formula, { displayMode: true, throwOnError: false });
        } catch (e) {
          return `<div class="math-block">${latexToMathML(formula)}</div>`;
        }
      }
      return `<div class="math-block">${latexToMathML(formula)}</div>`;
    })
    .replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      if (typeof katex !== 'undefined') {
        try {
          return katex.renderToString(formula, { displayMode: false, throwOnError: false });
        } catch (e) {
          return `<span class="math-inline">${latexToMathML(formula)}</span>`;
        }
      }
      return `<span class="math-inline">${latexToMathML(formula)}</span>`;
    });
}

function renderMathInTree(root) {
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn("KaTeX auto-render failed, fallback to MathML:", e);
    }
  }
}

// --- HUD & GAMIFICATION ---
function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starsEl = document.getElementById('starRating');
  const avBtn = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (avBtn) avBtn.textContent = appState.avatar;
  if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;

  // Update Stars
  let starStr = '⭐⭐☆☆☆';
  if (appState.xp >= 180) starStr = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 140) starStr = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 80) starStr = '⭐⭐⭐☆☆';
  else if (appState.xp >= 40) starStr = '⭐⭐☆☆☆';
  if (starsEl) starsEl.textContent = starStr;

  // Update Certificate info
  const certXP = document.getElementById('certXP');
  const certRank = document.getElementById('certRank');
  const certName = document.getElementById('certStudentName');
  if (certXP) certXP.textContent = appState.xp;
  if (certName) certName.textContent = appState.userName;
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc';
    else if (appState.xp >= 120) certRank.textContent = 'Giỏi';
    else if (appState.xp >= 60) certRank.textContent = 'Khá';
    else certRank.textContent = 'Đạt';
  }

  // Update Badges
  checkBadges();
}

function unlockBadge(index) {
  if (!appState.badges[index]) {
    appState.badges[index] = true;
    const badgeEl = document.getElementById(`badge-${index + 1}`);
    if (badgeEl) {
      badgeEl.classList.remove('locked');
      badgeEl.classList.add('unlocked');
    }
    playSound('levelup');
  }
}

function checkBadges() {
  // Badge 1: Read theory / start
  unlockBadge(0);

  // Badge 3: Correct >= 5 questions
  const correctCount = Object.values(appState.answered).filter(a => a.correct).length;
  if (correctCount >= 5) {
    unlockBadge(2);
  }

  // Badge 4: XP >= 160
  if (appState.xp >= 160) {
    unlockBadge(3);
  }

  // Badge 5: Perfect score 10/10
  if (correctCount === 10) {
    unlockBadge(4);
  }
}

// --- QUIZ DATA (10 QUESTIONS FROM SGK TR. 95 - 97) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Miền Nghiệm Hệ Bất Phương Trình (SGK Tr.95)",
    pts: 20,
    question: "Điểm nào sau đây thuộc miền nghiệm của hệ bất phương trình $\\begin{cases} x + y > 2 \\\\ x - y \\le 1 \\end{cases}$?",
    options: [
      { text: "$A(1; 1)$", correct: false },
      { text: "$B(-1; 2)$", correct: false },
      { text: "$C(3; 2)$", correct: true },
      { text: "$D(0; 2)$", correct: false }
    ],
    explanation: "Thay tọa độ từng điểm vào hệ: Với $C(3; 2)$, ta có $3 + 2 = 5 > 2$ (thỏa mãn) và $3 - 2 = 1 \\le 1$ (thỏa mãn). Vậy điểm $C(3; 2)$ thuộc miền nghiệm của hệ."
  },
  {
    id: 2,
    title: "Câu 2: Quỹ Tích Vectơ Trọng Tâm Tam Giác (SGK Tr.95)",
    pts: 20,
    question: "Cho tam giác $ABC$. Có bao nhiêu điểm $M$ thỏa mãn đẳng thức $|\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC}| = 3$?",
    options: [
      { text: "Vô số điểm", correct: true },
      { text: "Chỉ có 1 điểm duy nhất", correct: false },
      { text: "Có 2 điểm", correct: false },
      { text: "Có 3 điểm", correct: false }
    ],
    explanation: "Gọi $G$ là trọng tâm tam giác $ABC$. Với mọi điểm $M$, ta luôn có $\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} = 3\\overrightarrow{MG}$. Khi đó: $|\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC}| = 3 \\iff |3\\overrightarrow{MG}| = 3 \\iff 3MG = 3 \\iff MG = 1$. Tập hợp các điểm $M$ cách đều trọng tâm $G$ một khoảng cố định bằng 1 là đường tròn tâm $G$ bán kính $R = 1$. Do đó có vô số điểm $M$ thỏa mãn."
  },
  {
    id: 3,
    title: "Câu 3: Đỉnh Của Parabol & Hệ Số Hàm Bậc Hai (SGK Tr.95)",
    pts: 20,
    question: "Cho hàm số bậc hai $y = x^2 + bx + c$ có đồ thị là một parabol có đỉnh $I(1; 4)$. Giá trị của $b + c$ bằng:",
    options: [
      { text: "$-2$", correct: false },
      { text: "$5$", correct: false },
      { text: "$3$", correct: true },
      { text: "$-3$", correct: false }
    ],
    explanation: "Parabol có đỉnh $I(1; 4)$ nên hoành độ đỉnh $x_I = -\\frac{b}{2 \\cdot 1} = 1 \\implies b = -2$. Đỉnh $I$ thuộc parabol nên $4 = 1^2 + b \\cdot 1 + c \\iff 4 = 1 - 2 + c \\implies c = 5$. Do đó $b + c = (-2) + 5 = 3$."
  },
  {
    id: 4,
    title: "Câu 4: Mệnh Đề Về Đường Thẳng Oxy (SGK Tr.95)",
    pts: 20,
    question: "Trong mặt phẳng tọa độ $Oxy$, cho đường thẳng $\\Delta: x + 2y - 5 = 0$. Mệnh đề nào sau đây là **sai**?",
    options: [
      { text: "Vectơ $\\vec{n} = (1; 2)$ là một vectơ pháp tuyến của $\\Delta$.", correct: false },
      { text: "Vectơ $\\vec{u} = (-2; 1)$ là một vectơ chỉ phương của $\\Delta$.", correct: false },
      { text: "Điểm $M(1; 2)$ thuộc đường thẳng $\\Delta$.", correct: false },
      { text: "Đường thẳng $\\Delta$ có hệ số góc $k = 2$.", correct: true }
    ],
    explanation: "Từ phương trình $\\Delta: x + 2y - 5 = 0 \\iff 2y = -x + 5 \\iff y = -\\frac{1}{2}x + \\frac{5}{2}$. Do đó hệ số góc của đường thẳng $\\Delta$ phải là $k = -\\frac{1}{2}$, không phải $k = 2$. Vậy mệnh đề D là sai."
  },
  {
    id: 5,
    title: "Câu 5: Khai Triển Nhị Thức Newton (SGK Tr.95)",
    pts: 20,
    question: "Trong khai triển nhị thức Newton của $(2 + 3x)^4$, hệ số của $x^2$ là:",
    options: [
      { text: "$C_4^2$", correct: false },
      { text: "$4 C_4^2$", correct: false },
      { text: "$9 C_4^2$", correct: false },
      { text: "$36 C_4^2$", correct: true }
    ],
    explanation: "Số hạng chứa $x^2$ trong khai triển nhị thức Newton $(2 + 3x)^4$ là $C_4^2 \\cdot 2^{4-2} \\cdot (3x)^2 = C_4^2 \\cdot 2^2 \\cdot 3^2 \\cdot x^2 = 36 C_4^2 \\cdot x^2 = 36 \\cdot 6 \\cdot x^2 = 216 x^2$. Vậy hệ số của $x^2$ là $36 C_4^2$."
  },
  {
    id: 6,
    title: "Câu 6: Xác Suất Có Ít Nhất 1 Nữ (SGK Tr.95)",
    pts: 20,
    question: "Một tổ học sinh gồm có 7 nam và 3 nữ. Chọn ngẫu nhiên 2 người. Xác suất để trong 2 người được chọn có ít nhất 1 nữ là:",
    options: [
      { text: "$\\frac{7}{15}$", correct: false },
      { text: "$\\frac{8}{15}$", correct: true },
      { text: "$\\frac{1}{15}$", correct: false },
      { text: "$\\frac{2}{3}$", correct: false }
    ],
    explanation: "Số phần tử không gian mẫu: $n(\\Omega) = C_{10}^2 = 45$. Xét biến cố đối $\\overline{E}$: 'Cả 2 người được chọn đều là nam' $\\implies n(\\overline{E}) = C_7^2 = 21$. Xác suất biến cố đối: $P(\\overline{E}) = \\frac{21}{45} = \\frac{7}{15}$. Xác suất có ít nhất 1 nữ là: $P(E) = 1 - P(\\overline{E}) = 1 - \\frac{7}{15} = \\frac{8}{15}$."
  },
  {
    id: 7,
    title: "Câu 7: Phương Trình Chứa Căn Thức (Bài 10b Tr.96)",
    pts: 20,
    question: "Tập nghiệm của phương trình $\\sqrt{x^2 + 18x - 9} = 2x - 3$ là:",
    options: [
      { text: "$S = \\{5 - \\sqrt{19}; 5 + \\sqrt{19}\\}$", correct: false },
      { text: "$S = \\{5 + \\sqrt{19}\\}$", correct: true },
      { text: "$S = \\{5 - \\sqrt{19}\\}$", correct: false },
      { text: "$S = \\varnothing$", correct: false }
    ],
    explanation: "Bình phương hai vế: $x^2 + 18x - 9 = (2x - 3)^2 \\iff x^2 + 18x - 9 = 4x^2 - 12x + 9 \\iff 3x^2 - 30x + 18 = 0 \\iff x^2 - 10x + 6 = 0$. Phương trình có hai nghiệm: $x = 5 \\pm \\sqrt{19}$. Điều kiện có nghiệm: $2x - 3 \\ge 0 \\iff x \\ge 1{,}5$. Ta có $5 + \\sqrt{19} \\approx 9{,}36 > 1{,}5$ (thỏa mãn) và $5 - \\sqrt{19} \\approx 0{,}64 < 1{,}5$ (loại). Vậy tập nghiệm là $S = \\{5 + \\sqrt{19}\\}$."
  },
  {
    id: 8,
    title: "Câu 8: Đếm Số Tự Nhiên Chia Hết Cho 5 (Bài 11 Tr.96)",
    pts: 20,
    question: "Từ các chữ số thuộc tập $X = \\{0; 1; 2; 3; 4; 5; 6; 7; 8; 9\\}$, có bao nhiêu số tự nhiên dương nhỏ hơn $1\\,000$, chia hết cho 5 và các chữ số của nó đều khác nhau?",
    options: [
      { text: "$154$ số", correct: true },
      { text: "$171$ số", correct: false },
      { text: "$136$ số", correct: false },
      { text: "$144$ số", correct: false }
    ],
    explanation: "Số tự nhiên dương nhỏ hơn $1\\,000$ có thể có 1, 2 hoặc 3 chữ số: <br>• Số có 1 chữ số chia hết cho 5: chỉ có số $5$ (1 số). <br>• Số có 2 chữ số $\\overline{ab}$: Tận cùng $b=0 \\implies a$ có 9 cách; tận cùng $b=5 \\implies a$ có 8 cách. Tổng: $9 + 8 = 17$ số. <br>• Số có 3 chữ số $\\overline{abc}$: Tận cùng $c=0 \\implies a$ có 9 cách, $b$ có 8 cách ($9 \\times 8 = 72$ số); tận cùng $c=5 \\implies a$ có 8 cách, $b$ có 8 cách ($8 \\times 8 = 64$ số). Có $72 + 64 = 136$ số. <br>Tổng cộng: $1 + 17 + 136 = 154$ số."
  },
  {
    id: 9,
    title: "Câu 9: Phương Trình Chỉnh Hợp & Tổ Hợp (Bài 12 Tr.96)",
    pts: 20,
    question: "Số tự nhiên $n$ ($n \\ge 2$) thỏa mãn đẳng thức $A_n^2 + 24C_n^1 = 140$ là:",
    options: [
      { text: "$n = 4$", correct: false },
      { text: "$n = 5$", correct: true },
      { text: "$n = 6$", correct: false },
      { text: "$n = 7$", correct: false }
    ],
    explanation: "Ta có $A_n^2 = n(n-1)$ và $C_n^1 = n$. Phương trình trở thành: $n(n - 1) + 24n = 140 \\iff n^2 + 23n - 140 = 0 \\iff (n - 5)(n + 28) = 0$. Vì $n \\in \\mathbb{N}, n \\ge 2$ nên ta nhận $n = 5$."
  },
  {
    id: 10,
    title: "Câu 10: Xác Suất Tổng Ba Số Là Số Chẵn (Bài 20 Tr.97)",
    pts: 20,
    question: "Chọn ngẫu nhiên 3 số tự nhiên phân biệt từ tập hợp $S = \\{1; 2; 3; \\dots; 23\\}$. Xác suất để tổng của 3 số được chọn là một số chẵn bằng:",
    options: [
      { text: "$\\frac{81}{161}$", correct: true },
      { text: "$\\frac{80}{161}$", correct: false },
      { text: "$\\frac{1}{2}$", correct: false },
      { text: "$\\frac{40}{161}$", correct: false }
    ],
    explanation: "Tập $S$ gồm $11$ số chẵn và $12$ số lẻ. Số phần tử không gian mẫu: $n(\\Omega) = C_{23}^3 = 1\\,771$. Tổng 3 số là chẵn khi: <br>• Chọn 3 số chẵn: $C_{11}^3 = 165$ cách. <br>• Chọn 1 số chẵn và 2 số lẻ: $C_{11}^1 \\times C_{12}^2 = 11 \\times 66 = 726$ cách. <br>Số kết quả thuận lợi: $n(E) = 165 + 726 = 891$. Xác suất: $P(E) = \\frac{891}{1\\,771} = \\frac{81}{161}$."
  }
];

// --- RENDER ARENA QUIZ ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  const answeredCount = Object.keys(appState.answered).length;
  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');

  if (progressEl) progressEl.textContent = `Tiến Độ: ${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `Điểm Arena: ${appState.xp} XP`;

  let html = '';
  quizData.forEach((q, idx) => {
    const isAnswered = !!appState.answered[q.id];
    const userAnswer = appState.answered[q.id];

    html += `
      <div class="quiz-card" id="quizCard-${q.id}">
        <div class="quiz-card-header">
          <span class="quiz-q-num">CÂU ${idx + 1}</span>
          <span class="quiz-pts">+${q.pts} XP</span>
        </div>
        <div class="quiz-question">${formatMathText(q.question)}</div>
        <div class="quiz-options">
    `;

    q.options.forEach((opt, optIdx) => {
      let optClass = 'quiz-opt-btn';
      let disabled = '';

      if (isAnswered) {
        disabled = 'disabled';
        if (opt.correct) {
          optClass += ' correct';
        } else if (userAnswer && userAnswer.chosenIdx === optIdx && !opt.correct) {
          optClass += ' wrong';
        }
      }

      html += `
        <button class="${optClass}" ${disabled} onclick="handleQuizAnswer(${q.id}, ${optIdx})">
          ${formatMathText(opt.text)}
        </button>
      `;
    });

    html += `</div>`;

    if (isAnswered) {
      html += `
        <div class="explanation-box show">
          <strong>Giải thích chi tiết:</strong><br>
          ${formatMathText(q.explanation)}
        </div>
      `;
    }

    html += `</div>`;
  });

  container.innerHTML = html;
  renderMathInTree(container);
}

window.handleQuizAnswer = function(questionId, chosenIdx) {
  if (appState.answered[questionId]) return;

  const q = quizData.find(item => item.id === questionId);
  if (!q) return;

  const isCorrect = q.options[chosenIdx].correct;
  appState.answered[questionId] = {
    chosenIdx,
    correct: isCorrect
  };

  if (isCorrect) {
    appState.xp += q.pts;
    appState.streak += 1;
    playSound('correct');
  } else {
    appState.streak = 0;
    playSound('wrong');
  }

  updateHUD();
  renderQuiz();

  const answeredCount = Object.keys(appState.answered).length;
  const correctCount = Object.values(appState.answered).filter(a => a.correct).length;
  if (answeredCount === quizData.length && correctCount === quizData.length) {
    playSound('fanfare');
  }
};

// --- LAB 1: MIỀN NGHIỆM HỆ BẤT PHƯƠNG TRÌNH & TỐI ƯU HÓA TUYẾN TÍNH ---
const vertices = {
  'O': { x: 0, y: 0, label: 'O(0; 0)', val: 0, calc: '2(0) + 3(0) = 0' },
  'A': { x: 1, y: 0, label: 'A(1; 0)', val: 2, calc: '2(1) + 3(0) = 2' },
  'B': { x: 8/3, y: 10/3, label: 'B(8/3; 10/3)', val: 46/3, calc: '2(8/3) + 3(10/3) = 16/3 + 30/3 = 46/3 \\approx 15{,}33' },
  'C': { x: 0, y: 6, label: 'C(0; 6)', val: 18, calc: '2(0) + 3(6) = 18' }
};

function drawLinearProgLab() {
  const canvas = document.getElementById('progCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Coordinate mapping: origin at (80, 220), scale: 30px per unit
  const ox = 90;
  const oy = 210;
  const scale = 26;

  function toScreen(x, y) {
    return {
      sx: ox + x * scale,
      sy: oy - y * scale
    };
  }

  // Draw Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 14; x++) {
    const pt = toScreen(x, 0);
    ctx.beginPath();
    ctx.moveTo(pt.sx, 20);
    ctx.lineTo(pt.sx, 230);
    ctx.stroke();
  }
  for (let y = 0; y <= 7; y++) {
    const pt = toScreen(0, y);
    ctx.beginPath();
    ctx.moveTo(40, pt.sy);
    ctx.lineTo(500, pt.sy);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  // Ox
  ctx.beginPath();
  ctx.moveTo(50, oy);
  ctx.lineTo(510, oy);
  ctx.stroke();
  // Arrow Ox
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(510, oy);
  ctx.lineTo(500, oy - 4);
  ctx.lineTo(500, oy + 4);
  ctx.fill();

  // Oy
  ctx.beginPath();
  ctx.moveTo(ox, 240);
  ctx.lineTo(ox, 20);
  ctx.stroke();
  // Arrow Oy
  ctx.beginPath();
  ctx.moveTo(ox, 20);
  ctx.lineTo(ox - 4, 30);
  ctx.lineTo(ox + 4, 30);
  ctx.fill();

  // Axis Labels
  ctx.font = '12px Inter, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('x', 505, oy + 18);
  ctx.fillText('y', ox - 18, 25);
  ctx.fillText('O', ox - 15, oy + 15);

  // Scale numbers
  [2, 4, 6, 8, 10].forEach(n => {
    const pt = toScreen(n, 0);
    ctx.fillText(n.toString(), pt.sx - 4, oy + 15);
  });
  [2, 4, 6].forEach(n => {
    const pt = toScreen(0, n);
    ctx.fillText(n.toString(), ox - 16, pt.sy + 4);
  });

  // Feasible Region Polygon: O(0,0) -> A(1,0) -> B(8/3, 10/3) -> C(0,6)
  const ptO = toScreen(0, 0);
  const ptA = toScreen(1, 0);
  const ptB = toScreen(8/3, 10/3);
  const ptC = toScreen(0, 6);

  ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ptO.sx, ptO.sy);
  ctx.lineTo(ptA.sx, ptA.sy);
  ctx.lineTo(ptB.sx, ptB.sy);
  ctx.lineTo(ptC.sx, ptC.sy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Line x + y = 6 (cuts at (6,0) and (0,6))
  const line1_start = toScreen(-0.5, 6.5);
  const line1_end = toScreen(7, -1);
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(line1_start.sx, line1_start.sy);
  ctx.lineTo(line1_end.sx, line1_end.sy);
  ctx.stroke();

  // Line 2x - y = 2 (cuts at (1,0) and (0,-2), passes through B(8/3, 10/3), and x=4 -> y=6)
  const line2_start = toScreen(0.5, -1);
  const line2_end = toScreen(4.2, 6.4);
  ctx.strokeStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(line2_start.sx, line2_start.sy);
  ctx.lineTo(line2_end.sx, line2_end.sy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Vertices
  const vList = [
    { key: 'O', pt: ptO, name: 'O(0;0)', align: 'left' },
    { key: 'A', pt: ptA, name: 'A(1;0)', align: 'bottom' },
    { key: 'B', pt: ptB, name: 'B(8/3; 10/3)', align: 'top' },
    { key: 'C', pt: ptC, name: 'C(0;6)', align: 'right' }
  ];

  vList.forEach(v => {
    const isActive = (appState.activeVertex === v.key);
    ctx.fillStyle = isActive ? '#ec4899' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(v.pt.sx, v.pt.sy, isActive ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isActive ? '#f43f5e' : '#f1f5f9';
    ctx.font = isActive ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
    if (v.key === 'O') ctx.fillText(v.name, v.pt.sx + 8, v.pt.sy + 16);
    else if (v.key === 'A') ctx.fillText(v.name, v.pt.sx - 15, v.pt.sy + 18);
    else if (v.key === 'B') ctx.fillText(v.name, v.pt.sx + 8, v.pt.sy - 8);
    else if (v.key === 'C') ctx.fillText(v.name, v.pt.sx + 8, v.pt.sy + 4);
  });

  // Legend
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = '#06b6d4';
  ctx.fillText('d1: x + y = 6', 360, 45);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('d2: 2x - y = 2', 360, 65);
  ctx.fillStyle = 'rgba(165, 180, 252, 0.9)';
  ctx.fillText('Miền nghiệm OABC', 360, 85);
}

function selectVertex(key) {
  appState.activeVertex = key;
  drawLinearProgLab();
  playSound('click');

  const info = vertices[key];
  const outEl = document.getElementById('progOutput');
  if (outEl && info) {
    const isMax = (key === 'C');
    outEl.innerHTML = `
      <strong>Đang khảo sát đỉnh: ${info.label}</strong><br>
      • Giá trị hàm mục tiêu: $F(${info.x === 8/3 ? '8/3' : info.x}; ${info.y === 10/3 ? '10/3' : info.y}) = ${info.calc}$.<br>
      ${isMax ? '<span style="color: #4ade80; font-weight: bold;">🎉 ĐÂY LÀ GIÁ TRỊ LỚN NHẤT CỦA HÀM MỤC TIÊU: $F_{\\max} = 18$ tại đỉnh $C(0; 6)$!</span>' : 'Tiếp tục khảo sát các đỉnh khác để tìm giá trị cực đại.'}
    `;
    renderMathInTree(outEl);
  }
  unlockBadge(1);
}

// --- LAB 2: MÔ PHỎNG QUỸ TÍCH VECTƠ TRỌNG TÂM ---
function drawVectorLab() {
  const canvas = document.getElementById('vectorCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Triangle points
  const A = { x: 180, y: 70 };
  const B = { x: 100, y: 210 };
  const C = { x: 380, y: 210 };

  // Centroid G = (A + B + C) / 3
  const G = {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3
  };

  // Radius for MG = 1 (visually scaled to 48px)
  const radius = 48;
  const M = {
    x: G.x + radius * Math.cos(appState.vectorAngle),
    y: G.y + radius * Math.sin(appState.vectorAngle)
  };

  // Draw Circle Locus
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(G.x, G.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Triangle ABC
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(B.x, B.y);
  ctx.lineTo(C.x, C.y);
  ctx.closePath();
  ctx.stroke();

  // Helper: Draw Vector Arrow
  function drawArrow(from, to, color, width = 2) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLen = 8;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // Draw Vectors MA, MB, MC (semi-transparent)
  drawArrow(M, A, 'rgba(148, 163, 184, 0.5)', 1.5);
  drawArrow(M, B, 'rgba(148, 163, 184, 0.5)', 1.5);
  drawArrow(M, C, 'rgba(148, 163, 184, 0.5)', 1.5);

  // Draw Vector MG and 3*MG
  drawArrow(M, G, '#ec4899', 2.5);

  // Draw Points A, B, C
  const pts = [
    { pt: A, label: 'A', col: '#818cf8', dx: -5, dy: -10 },
    { pt: B, label: 'B', col: '#818cf8', dx: -18, dy: 15 },
    { pt: C, label: 'C', col: '#818cf8', dx: 10, dy: 15 },
    { pt: G, label: 'G (Trọng tâm)', col: '#f59e0b', dx: 10, dy: 5 },
    { pt: M, label: 'M', col: '#ec4899', dx: 10, dy: -5 }
  ];

  pts.forEach(p => {
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(p.pt.x, p.pt.y, (p.label === 'M' || p.label.startsWith('G')) ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(p.label, p.pt.x + p.dx, p.pt.y + p.dy);
  });

  // Info Box on Canvas
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 1;
  ctx.fillRect(360, 20, 165, 85);
  ctx.strokeRect(360, 20, 165, 85);

  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('Hệ Thức Vectơ:', 370, 38);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('MA + MB + MC = 3MG', 370, 56);
  ctx.fillStyle = '#ec4899';
  ctx.fillText('|3MG| = 3  =>  MG = 1', 370, 74);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('Quỹ tích: (G; R = 1)', 370, 92);
}

function updateVectorOutput() {
  const outEl = document.getElementById('vectorOutput');
  if (!outEl) return;
  const deg = Math.round((appState.vectorAngle * 180 / Math.PI) % 360);
  outEl.innerHTML = `
    <strong>Mô Phỏng Đẳng Thức Vectơ Trọng Tâm Tam Giác $ABC$:</strong><br>
    • Điểm $M$ đang ở góc quay $\\theta = ${deg}^\\circ$ trên đường tròn tâm $G$ bán kính $R = 1$.<br>
    • Đẳng thức vectơ: $\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} = 3\\overrightarrow{MG}$.<br>
    • Độ dài tổng vectơ luôn không đổi: $|\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC}| = 3|\\overrightarrow{MG}| = 3 \\cdot 1 = 3$.<br>
    <span style="color: #38bdf8;">=> Quỹ tích của điểm $M$ chính là đường tròn tâm $G$ bán kính $R = 1$ (có vô số điểm $M$).</span>
  `;
  renderMathInTree(outEl);
}

function animateVectorStep() {
  if (!appState.isAnimatingVector) return;
  appState.vectorAngle += 0.03;
  if (appState.vectorAngle > Math.PI * 2) {
    appState.vectorAngle -= Math.PI * 2;
  }
  drawVectorLab();
  updateVectorOutput();
  requestAnimationFrame(animateVectorStep);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) {
        targetContent.classList.add('active');
        renderMathInTree(targetContent);
      }
      playSound('click');
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playSound('click');
    });
  }

  // Reset Progress
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học và điểm XP?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [true, false, false, false, false];
        updateHUD();
        renderQuiz();
        playSound('click');
      }
    });
  }

  // Avatar Modal
  const avBtn = document.getElementById('avatarBtn');
  const avModal = document.getElementById('avatarModal');
  const closeAvModal = document.getElementById('btnCloseModal');

  if (avBtn && avModal) {
    avBtn.addEventListener('click', () => {
      avModal.style.display = 'flex';
      avModal.classList.add('active');
      playSound('click');
    });
  }

  if (closeAvModal && avModal) {
    closeAvModal.addEventListener('click', () => {
      avModal.style.display = 'none';
      avModal.classList.remove('active');
      playSound('click');
    });
  }

  document.querySelectorAll('.av-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      appState.avatar = opt.getAttribute('data-av');
      appState.userName = opt.getAttribute('data-name');
      updateHUD();
      if (avModal) {
        avModal.style.display = 'none';
        avModal.classList.remove('active');
      }
      playSound('click');
    });
  });

  // Lab 1 controls
  const btnVertexO = document.getElementById('btnVertexO');
  const btnVertexA = document.getElementById('btnVertexA');
  const btnVertexB = document.getElementById('btnVertexB');
  const btnVertexC = document.getElementById('btnVertexC');

  if (btnVertexO) btnVertexO.addEventListener('click', () => selectVertex('O'));
  if (btnVertexA) btnVertexA.addEventListener('click', () => selectVertex('A'));
  if (btnVertexB) btnVertexB.addEventListener('click', () => selectVertex('B'));
  if (btnVertexC) btnVertexC.addEventListener('click', () => selectVertex('C'));

  // Lab 2 controls
  const btnAnimateVector = document.getElementById('btnAnimateVector');
  const btnResetVector = document.getElementById('btnResetVector');

  if (btnAnimateVector) {
    btnAnimateVector.addEventListener('click', () => {
      appState.isAnimatingVector = !appState.isAnimatingVector;
      btnAnimateVector.textContent = appState.isAnimatingVector ? '⏸️ Tạm Dừng' : '🔄 Di Chuyển M Trên Quỹ Tích';
      playSound('click');
      if (appState.isAnimatingVector) {
        animateVectorStep();
      }
      unlockBadge(1);
    });
  }

  if (btnResetVector) {
    btnResetVector.addEventListener('click', () => {
      appState.isAnimatingVector = false;
      appState.vectorAngle = 0;
      if (btnAnimateVector) btnAnimateVector.textContent = '🔄 Di Chuyển M Trên Quỹ Tích';
      drawVectorLab();
      updateVectorOutput();
      playSound('click');
    });
  }

  // Vector canvas interactive drag/click
  const vCanvas = document.getElementById('vectorCanvas');
  if (vCanvas) {
    vCanvas.addEventListener('click', (e) => {
      const rect = vCanvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (vCanvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (vCanvas.height / rect.height);
      const G = { x: (180 + 100 + 380) / 3, y: (70 + 210 + 210) / 3 };
      appState.vectorAngle = Math.atan2(mouseY - G.y, mouseX - G.x);
      drawVectorLab();
      updateVectorOutput();
      playSound('click');
      unlockBadge(1);
    });
  }

  // Print Certificate
  const printBtn = document.getElementById('btnPrintCert');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Init Components
  updateHUD();
  renderQuiz();
  drawLinearProgLab();
  selectVertex('O');
  drawVectorLab();
  updateVectorOutput();

  renderMathInTree(document.body);
});
