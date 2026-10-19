/**
 * TOÁN 12 - CHƯƠNG III: CÁC SỐ ĐẶC TRƯNG ĐO ĐỘ PHÂN TÁN CHO MẪU SỐ LIỆU GHÉP NHÓM
 * BÀI TẬP CUỐI CHƯƠNG III - BẢNG ĐIỀU KHIỂN & ĐẤU TRƯỜNG TƯƠNG TÁC
 * Tuân thủ 100% Cyber Logic & Quantum Indigo, KaTeX Offline, Web Audio API
 */

// 1. STATE MANAGEMENT
const appState = {
    avatar: '👑',
    userName: 'Chiến Binh Logic',
    userTitle: 'Đại Sư Thống Kê Toán 12',
    stars: 2,
    xp: 0,
    streak: 0,
    sound: true,
    answered: {},
    badges: [false, false, false, false, false]
};

// 2. WEB AUDIO API SYNTHESIS (100% Offline)
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone(freq, type, duration, gainVal = 0.1) {
    if (!appState.sound) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.warn('Audio error:', e);
    }
}

function playClick() {
    playTone(520, 'sine', 0.08, 0.05);
}

function playCorrect() {
    if (!appState.sound) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(f, now + i * 0.08);
            gain.gain.setValueAtTime(0.08, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.2);
        });
    } catch (e) {}
}

function playWrong() {
    if (!appState.sound) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    } catch (e) {}
}

function playLevelUp() {
    if (!appState.sound) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        [440, 554.37, 659.25, 880].forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.1);
            gain.gain.setValueAtTime(0.12, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    } catch (e) {}
}

function playFanfare() {
    if (!appState.sound) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const notes = [
            { f: 523.25, d: 0.15, t: 0 },
            { f: 523.25, d: 0.15, t: 0.15 },
            { f: 523.25, d: 0.15, t: 0.3 },
            { f: 659.25, d: 0.3,  t: 0.45 },
            { f: 587.33, d: 0.15, t: 0.8 },
            { f: 659.25, d: 0.15, t: 0.95 },
            { f: 783.99, d: 0.6,  t: 1.1 }
        ];
        notes.forEach(n => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(n.f, now + n.t);
            gain.gain.setValueAtTime(0.12, now + n.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + n.t);
            osc.stop(now + n.t + n.d);
        });
    } catch (e) {}
}

// 3. MATH FORMULA RENDERING & KATEX / MATHML FALLBACK
function formatMathText(text) {
    if (!text) return '';
    return text;
}

function renderMathInTree(root) {
    if (window.renderMathInElement) {
        try {
            window.renderMathInElement(root, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ],
                throwOnError: false,
                strict: false
            });
            return;
        } catch (e) {
            console.warn('KaTeX render failed, using MathML fallback', e);
        }
    }
}

// 4. DATA CHO ĐẤU TRƯỜNG SGK (10 Câu từ SGK KNTT Toán 12 trang 85 - 86)
const quizData = [
    {
        id: 1,
        title: "Câu 3.9 (SGK Trang 85): Khoảng biến thiên tuổi thọ của 20 con hổ",
        pts: 20,
        question: "Khảo sát tuổi thọ của $20$ con hổ trong vườn thú được ghép nhóm: $[14; 15)$ ($1$), $[15; 16)$ ($3$), $[16; 17)$ ($8$), $[17; 18)$ ($6$), $[18; 19)$ ($2$). Khoảng biến thiên $R$ của mẫu số liệu ghép nhóm này là:",
        options: [
            { text: "$R = 19$", correct: false },
            { text: "$R = 14$", correct: false },
            { text: "$R = 5$", correct: true },
            { text: "$R = 8$", correct: false }
        ],
        explanation: "Khoảng biến thiên $R$ là hiệu số giữa đầu mút phải của nhóm cuối cùng và đầu mút trái của nhóm đầu tiên: $$R = a_6 - a_1 = 19 - 14 = 5$$ Đáp án đúng là $R = 5$."
    },
    {
        id: 2,
        title: "Câu 3.10 (SGK Trang 85): Nhóm chứa tứ phân vị thứ nhất",
        pts: 20,
        question: "Cũng với mẫu số liệu $20$ con hổ trên, nhóm chứa tứ phân vị thứ nhất $Q_1$ là:",
        options: [
            { text: "$[14; 15)$", correct: false },
            { text: "$[15; 16)$", correct: false },
            { text: "$[16; 17)$", correct: true },
            { text: "$[17; 18)$", correct: false }
        ],
        explanation: "Cỡ mẫu $n = 20$. Ta có vị trí của $Q_1$ tương ứng với $\\frac{n}{4} = \\frac{20}{4} = 5$.<br>Bảng tần số tích lũy: $cf_1 = 1$, $cf_2 = 1 + 3 = 4$, $cf_3 = 4 + 8 = 12$.<br>Do $cf_2 = 4 < 5 \\le cf_3 = 12$, nên nhóm chứa tứ phân vị thứ nhất là nhóm thứ $3$: $[16; 17)$."
    },
    {
        id: 3,
        title: "Câu 3.11 (SGK Trang 85): Nhóm chứa tứ phân vị thứ ba",
        pts: 20,
        question: "Cũng với mẫu số liệu $20$ con hổ trên, nhóm chứa tứ phân vị thứ ba $Q_3$ là:",
        options: [
            { text: "$[15; 16)$", correct: false },
            { text: "$[16; 17)$", correct: false },
            { text: "$[17; 18)$", correct: true },
            { text: "$[18; 19)$", correct: false }
        ],
        explanation: "Vị trí của $Q_3$ tương ứng với $\\frac{3n}{4} = \\frac{3 \\cdot 20}{4} = 15$.<br>Tần số tích lũy: $cf_3 = 12$, $cf_4 = 12 + 6 = 18$.<br>Do $cf_3 = 12 < 15 \\le cf_4 = 18$, nên nhóm chứa tứ phân vị thứ ba là nhóm thứ $4$: $[17; 18)$."
    },
    {
        id: 4,
        title: "Câu 4 (Vận dụng 3.9 - 3.11): Khoảng tứ phân vị của tuổi thọ 20 con hổ",
        pts: 20,
        question: "Tính chính xác khoảng tứ phân vị $\\Delta_Q$ của mẫu số liệu tuổi thọ $20$ con hổ trên:",
        options: [
            { text: "$\\Delta_Q = 1{,}375$", correct: true },
            { text: "$\\Delta_Q = 1{,}500$", correct: false },
            { text: "$\\Delta_Q = 1{,}250$", correct: false },
            { text: "$\\Delta_Q = 2{,}000$", correct: false }
        ],
        explanation: "Áp dụng công thức tính tứ phân vị cho mẫu số liệu ghép nhóm:<br>• $Q_1 = 16 + \\frac{5 - 4}{8} \\cdot (17 - 16) = 16 + \\frac{1}{8} = 16{,}125$.<br>• $Q_3 = 17 + \\frac{15 - 12}{6} \\cdot (18 - 17) = 17 + \\frac{3}{6} = 17{,}5$.<br>Do đó khoảng tứ phân vị là: $$\\Delta_Q = Q_3 - Q_1 = 17{,}5 - 16{,}125 = 1{,}375$$"
    },
    {
        id: 5,
        title: "Câu 3.12 (SGK Trang 85): Tính chất nhóm biên của các số đặc trưng",
        pts: 20,
        question: "Số đặc trưng nào sau đây KHÔNG sử dụng thông tin của nhóm số liệu đầu tiên và nhóm số liệu cuối cùng?",
        options: [
            { text: "Khoảng biến thiên", correct: false },
            { text: "Khoảng tứ phân vị", correct: true },
            { text: "Phương sai", correct: false },
            { text: "Độ lệch chuẩn", correct: false }
        ],
        explanation: "Khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1$ chỉ đo độ phân tán của $50\\%$ số liệu ở phần trung tâm của mẫu số liệu và không bị ảnh hưởng bởi nhóm đầu tiên cũng như nhóm cuối cùng (loại bỏ ảnh hưởng của các giá trị ngoại lai)."
    },
    {
        id: 6,
        title: "Câu 3.13 (SGK Trang 85): Thay đổi tần số các nhóm",
        pts: 20,
        question: "Nếu thay tất cả các tần số trong mẫu số liệu ghép nhóm của $20$ con hổ trên bằng $4$ thì số đặc trưng nào sau đây KHÔNG thay đổi?",
        options: [
            { text: "Khoảng biến thiên", correct: true },
            { text: "Khoảng tứ phân vị", correct: false },
            { text: "Phương sai", correct: false },
            { text: "Độ lệch chuẩn", correct: false }
        ],
        explanation: "Khoảng biến thiên $R = a_{k+1} - a_1 = 19 - 14 = 5$ chỉ phụ thuộc vào đầu mút của nhóm đầu và nhóm cuối, hoàn toàn không phụ thuộc vào tần số của các nhóm. Trong khi đó $Q_1, Q_3, s^2, s$ đều phụ thuộc trực tiếp vào tần số $m_i$."
    },
    {
        id: 7,
        title: "Bài 3.14 (SGK Trang 86): Khoảng tứ phân vị thời gian sử dụng pin",
        pts: 20,
        question: "Thời gian sử dụng pin liên tục của $40$ điện thoại (giờ): $[13; 14)$ ($4$), $[14; 15)$ ($10$), $[15; 16)$ ($14$), $[16; 17)$ ($8$), $[17; 18)$ ($4$). Khoảng tứ phân vị $\\Delta_Q$ của mẫu ghép nhóm là:",
        options: [
            { text: "$\\Delta_Q = 1{,}65$ (giờ)", correct: true },
            { text: "$\\Delta_Q = 1{,}45$ (giờ)", correct: false },
            { text: "$\\Delta_Q = 2{,}15$ (giờ)", correct: false },
            { text: "$\\Delta_Q = 1{,}80$ (giờ)", correct: false }
        ],
        explanation: "Cỡ mẫu $n = 40$.<br>• $\\frac{n}{4} = 10 \\Rightarrow Q_1$ thuộc nhóm $[14; 15)$. $Q_1 = 14 + \\frac{10 - 4}{10} \\cdot 1 = 14{,}6$.<br>• $\\frac{3n}{4} = 30 \\Rightarrow Q_3$ thuộc nhóm $[16; 17)$ (vì $cf_3 = 28 < 30 \\le 36$). $Q_3 = 16 + \\frac{30 - 28}{8} \\cdot 1 = 16{,}25$.<br>Khoảng tứ phân vị: $$\\Delta_Q = Q_3 - Q_1 = 16{,}25 - 14{,}6 = 1{,}65\\text{ (giờ)}$$"
    },
    {
        id: 8,
        title: "Bài 3.14 (SGK Trang 86): Độ lệch chuẩn thời gian sử dụng pin",
        pts: 20,
        question: "Với số liệu thời gian sử dụng pin của $40$ điện thoại ở câu trên, độ lệch chuẩn $s$ gần nhất với giá trị nào sau đây?",
        options: [
            { text: "$s \\approx 1{,}11$ (giờ)", correct: true },
            { text: "$s \\approx 1{,}24$ (giờ)", correct: false },
            { text: "$s \\approx 0{,}98$ (giờ)", correct: false },
            { text: "$s \\approx 1{,}52$ (giờ)", correct: false }
        ],
        explanation: "Giá trị đại diện: $13{,}5; 14{,}5; 15{,}5; 16{,}5; 17{,}5$.<br>• Số trung bình: $\\bar{x} = \\frac{4 \\cdot 13{,}5 + 10 \\cdot 14{,}5 + 14 \\cdot 15{,}5 + 8 \\cdot 16{,}5 + 4 \\cdot 17{,}5}{40} = 15{,}45$.<br>• Tổng bình phương: $\\sum m_i x_i^2 = 9597{,}5$.<br>• Phương sai: $s^2 = \\frac{9597{,}5}{40} - (15{,}45)^2 = 239{,}9375 - 238{,}7025 = 1{,}235$.<br>• Độ lệch chuẩn: $$s = \\sqrt{1{,}235} \\approx 1{,}11\\text{ (giờ)}$$"
    },
    {
        id: 9,
        title: "Bài 3.15 (SGK Trang 86): Ứng dụng độ lệch chuẩn trong đầu tư tài chính",
        pts: 20,
        question: "Một nhà đầu tư theo dõi lợi nhuận hàng tháng của hai quỹ cổ phiếu A và B trong $3$ năm qua. Hai quỹ có tỉ suất sinh lời trung bình bằng nhau ($\\bar{x}_A = \\bar{x}_B = 12\\%$/năm), nhưng độ lệch chuẩn tương ứng là $s_A = 2{,}5\\%$ và $s_B = 6{,}8\\%$. Nhận định nào sau đây là chuẩn xác nhất?",
        options: [
            { text: "Quỹ B có mức biến động lợi nhuận ít hơn nên an toàn hơn.", correct: false },
            { text: "Quỹ A có độ lệch chuẩn nhỏ hơn, mức độ rủi ro thấp hơn và lợi nhuận ổn định hơn.", correct: true },
            { text: "Hai quỹ có độ rủi ro tương đương nhau vì cùng tỉ suất sinh lời trung bình.", correct: false },
            { text: "Quỹ A có mức độ phân tán lớn hơn nên rủi ro cao hơn.", correct: false }
        ],
        explanation: "Trong quản lý danh mục tài chính, độ lệch chuẩn đo lường mức độ biến động (rủi ro). Khi hai quỹ có cùng mức sinh lời kỳ vọng $\\bar{x}$, quỹ nào có độ lệch chuẩn $s$ nhỏ hơn thì mức độ phân tán quanh trung bình thấp hơn, nghĩa là ít rủi ro và ổn định hơn. Do đó Quỹ A an toàn và ít rủi ro hơn Quỹ B."
    },
    {
        id: 10,
        title: "Bài 3.17 (SGK Trang 86): So sánh độ ổn định của hai vôn kế",
        pts: 20,
        question: "Hai học sinh An và Bình đo hiệu điện thế của cùng một nguồn điện bằng hai vôn kế khác nhau. Sau $20$ lần đo, cả hai đều thu được hiệu điện thế trung bình là $220\\text{ V}$, nhưng độ lệch chuẩn của An là $s_{An} = 0{,}85\\text{ V}$, còn của Bình là $s_{Binh} = 2{,}40\\text{ V}$. Kết luận nào sau đây đúng?",
        options: [
            { text: "Vôn kế của Bình đo chính xác và ổn định hơn vôn kế của An.", correct: false },
            { text: "Vôn kế của An cho kết quả phân tán ít hơn, các lần đo tập trung hơn quanh $220\\text{ V}$, độ ổn định cao hơn.", correct: true },
            { text: "Hai vôn kế có độ ổn định ngang nhau vì cùng cho số trung bình $220\\text{ V}$.", correct: false },
            { text: "Độ lệch chuẩn không phản ánh tính ổn định của thiết bị đo.", correct: false }
        ],
        explanation: "Độ lệch chuẩn $s$ càng nhỏ thì các số liệu thực nghiệm càng tập trung sát với giá trị trung bình, mức độ sai lệch ngẫu nhiên giữa các lần đo càng thấp. Vì $s_{An} = 0{,}85\\text{ V} < s_{Binh} = 2{,}40\\text{ V}$, nên vôn kế của An đo ổn định và tin cậy hơn vôn kế của Bình."
    }
];

// 5. INITIALIZE QUIZ ARENA
function initQuiz() {
    const container = document.getElementById('quizContainer');
    if (!container) return;
    container.innerHTML = '';

    quizData.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.id = `quizCard-${q.id}`;

        const header = document.createElement('div');
        header.className = 'quiz-card-header';
        header.innerHTML = `
            <span class="quiz-badge">CÂU ${q.id}/10</span>
            <span class="quiz-pts">+${q.pts} XP</span>
        `;

        const questionEl = document.createElement('div');
        questionEl.className = 'quiz-question';
        questionEl.innerHTML = `<strong>${q.title}</strong><p style="margin-top: 8px;">${q.question}</p>`;

        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'quiz-options';

        q.options.forEach((opt, optIndex) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.setAttribute('data-qid', q.id);
            btn.setAttribute('data-optidx', optIndex);
            const optLabels = ['A', 'B', 'C', 'D'];
            btn.innerHTML = `<span class="opt-label">${optLabels[optIndex]}</span> <span class="opt-text">${opt.text}</span>`;
            btn.addEventListener('click', () => handleOptionClick(q, optIndex, btn, card));
            optionsGrid.appendChild(btn);
        });

        const explanationBox = document.createElement('div');
        explanationBox.className = 'explanation-box';
        explanationBox.id = `explanation-${q.id}`;
        explanationBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong><p style="margin-top: 6px;">${q.explanation}</p>`;

        card.appendChild(header);
        card.appendChild(questionEl);
        card.appendChild(optionsGrid);
        card.appendChild(explanationBox);
        container.appendChild(card);
    });

    renderMathInTree(container);
    updateArenaHeader();
}

function handleOptionClick(question, chosenIdx, clickedBtn, card) {
    if (appState.answered[question.id]) return;

    appState.answered[question.id] = true;
    const isCorrect = question.options[chosenIdx].correct;
    const allBtns = card.querySelectorAll('.quiz-opt-btn');

    allBtns.forEach((b, idx) => {
        b.disabled = true;
        if (question.options[idx].correct) {
            b.classList.add('correct');
        }
    });

    if (isCorrect) {
        clickedBtn.classList.add('correct');
        appState.xp += question.pts;
        appState.streak += 1;
        playCorrect();
    } else {
        clickedBtn.classList.add('wrong');
        appState.streak = 0;
        playWrong();
    }

    const expBox = card.querySelector('.explanation-box');
    if (expBox) {
        expBox.classList.add('show');
        renderMathInTree(expBox);
    }

    updateHud();
    updateArenaHeader();
    checkBadges();
}

function updateArenaHeader() {
    const answeredCount = Object.keys(appState.answered).length;
    const progressEl = document.getElementById('arenaProgress');
    const scoreEl = document.getElementById('arenaScore');
    if (progressEl) progressEl.innerText = `Tiến Độ: ${answeredCount}/10`;
    if (scoreEl) scoreEl.innerText = `Điểm Arena: ${appState.xp} XP`;
}

// 6. HUD & STATE SYNC
function updateHud() {
    const xpEl = document.getElementById('xpDisplay');
    const streakEl = document.getElementById('streakDisplay');
    const starEl = document.getElementById('starRating');
    const userTitleEl = document.getElementById('userTitle');
    const userNameEl = document.getElementById('userNameDisplay');
    const avatarBtn = document.getElementById('avatarBtn');

    if (xpEl) xpEl.innerText = `${appState.xp}`;
    if (streakEl) streakEl.innerText = `🔥 ${appState.streak}`;
    if (userNameEl) userNameEl.innerText = appState.userName;
    if (avatarBtn) avatarBtn.innerText = appState.avatar;

    // Tính số sao
    let stars = 2;
    if (appState.xp >= 60) stars = 3;
    if (appState.xp >= 120) stars = 4;
    if (appState.xp >= 180) stars = 5;
    appState.stars = stars;
    if (starEl) starEl.innerText = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);

    // Cập nhật danh hiệu
    if (appState.xp >= 180) {
        appState.userTitle = "Huyền Thoại Thống Kê 👑";
    } else if (appState.xp >= 120) {
        appState.userTitle = "Bậc Thầy Đo Độ Phân Tán 🌟";
    } else if (appState.xp >= 60) {
        appState.userTitle = "Chuyên Viên Dữ Liệu 📊";
    }
    if (userTitleEl) userTitleEl.innerText = appState.userTitle;

    // Cập nhật chứng nhận
    const certScore = document.getElementById('certScore');
    const certRank = document.getElementById('certRank');
    const certName = document.getElementById('certStudentName');
    if (certScore) certScore.innerText = `${appState.xp} XP`;
    if (certRank) certRank.innerText = appState.userTitle;
    if (certName) certName.innerText = appState.userName;
}

// 7. CHECK & UNLOCK BADGES
function checkBadges() {
    // Badge 1: Đã xem lý thuyết
    // Badge 2: Tương tác Lab 1
    // Badge 3: Tương tác Lab 2
    // Badge 4: Điểm Arena >= 160 XP
    if (appState.xp >= 160 && !appState.badges[3]) {
        unlockBadge(3);
    }
    // Badge 5: Đạt trọn vẹn 200 XP (10/10)
    if (appState.xp === 200 && !appState.badges[4]) {
        unlockBadge(4);
        playFanfare();
    }
}

function unlockBadge(index) {
    if (appState.badges[index]) return;
    appState.badges[index] = true;
    const badgeEl = document.getElementById(`badge-${index + 1}`);
    if (badgeEl) {
        badgeEl.style.opacity = '1';
        badgeEl.style.borderColor = '#10b981';
        badgeEl.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
    }
    playLevelUp();
}

// 8. LAB 1: KHẢO SÁT TUỔI THỌ 20 CON HỔ SGK & BOX PLOT
const tigerGroups = [
    { label: '[14; 15)', a: 14, b: 15, mid: 14.5, defaultFreq: 1 },
    { label: '[15; 16)', a: 15, b: 16, mid: 15.5, defaultFreq: 3 },
    { label: '[16; 17)', a: 16, b: 17, mid: 16.5, defaultFreq: 8 },
    { label: '[17; 18)', a: 17, b: 18, mid: 17.5, defaultFreq: 6 },
    { label: '[18; 19)', a: 18, b: 19, mid: 18.5, defaultFreq: 2 }
];

function getTigerFrequencies() {
    const freqs = [];
    for (let i = 0; i < 5; i++) {
        const input = document.getElementById(`freq${i}`);
        const val = input ? parseInt(input.value, 10) : tigerGroups[i].defaultFreq;
        freqs.push(isNaN(val) || val < 0 ? 0 : val);
    }
    return freqs;
}

function calculateGroupStats(groups, freqs) {
    const n = freqs.reduce((acc, v) => acc + v, 0);
    if (n === 0) return null;

    // Tần số tích lũy
    const cf = [];
    let sum = 0;
    for (let f of freqs) {
        sum += f;
        cf.push(sum);
    }

    // Khoảng biến thiên
    let firstIdx = freqs.findIndex(f => f > 0);
    let lastIdx = 4;
    for (let i = freqs.length - 1; i >= 0; i--) {
        if (freqs[i] > 0) {
            lastIdx = i;
            break;
        }
    }
    if (firstIdx === -1) firstIdx = 0;
    const R = groups[lastIdx].b - groups[firstIdx].a;

    // Hàm tính tứ phân vị
    function calcQ(pRatio) {
        const target = pRatio * n;
        let p = 0;
        for (let i = 0; i < cf.length; i++) {
            if (cf[i] >= target) {
                p = i;
                break;
            }
        }
        const cfPrev = p === 0 ? 0 : cf[p - 1];
        const m = freqs[p];
        if (m === 0) return groups[p].a;
        const h = groups[p].b - groups[p].a;
        return groups[p].a + ((target - cfPrev) / m) * h;
    }

    const Q1 = calcQ(0.25);
    const Q2 = calcQ(0.5);
    const Q3 = calcQ(0.75);
    const deltaQ = Q3 - Q1;

    // Số trung bình và Phương sai
    let sumMX = 0;
    let sumMX2 = 0;
    for (let i = 0; i < groups.length; i++) {
        sumMX += freqs[i] * groups[i].mid;
        sumMX2 += freqs[i] * (groups[i].mid ** 2);
    }
    const mean = sumMX / n;
    const variance = (sumMX2 / n) - (mean ** 2);
    const stdDev = Math.sqrt(Math.max(0, variance));

    return {
        n,
        R,
        Q1,
        Q2,
        Q3,
        deltaQ,
        mean,
        variance,
        stdDev,
        min: groups[firstIdx].a,
        max: groups[lastIdx].b
    };
}

function drawTigerChart() {
    const canvas = document.getElementById('tigerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const freqs = getTigerFrequencies();
    const stats = calculateGroupStats(tigerGroups, freqs);
    if (!stats) return;

    // Vẽ biểu đồ cột tần số phía trên (chiều cao 110px)
    const chartBottom = 110;
    const maxFreq = Math.max(...freqs, 10);
    const leftMargin = 50;
    const rightMargin = 30;
    const plotWidth = width - leftMargin - rightMargin;
    const barWidth = plotWidth / 5;

    // Trục hoành biểu đồ cột
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftMargin, chartBottom);
    ctx.lineTo(width - rightMargin, chartBottom);
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
        const barH = (freqs[i] / maxFreq) * 80;
        const x = leftMargin + i * barWidth;
        const y = chartBottom - barH;

        // Cột màu gradient
        const grad = ctx.createLinearGradient(x, y, x, chartBottom);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.85)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 4, y, barWidth - 8, barH);
        ctx.strokeStyle = '#818cf8';
        ctx.strokeRect(x + 4, y, barWidth - 8, barH);

        // Hiển thị tần số trên đỉnh cột
        if (freqs[i] > 0) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${freqs[i]}`, x + barWidth / 2, y - 5);
        }

        // Nhãn nhóm
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tigerGroups[i].label, x + barWidth / 2, chartBottom + 14);
    }

    // Vẽ Box-Plot ở phần dưới (y = 150 -> 180)
    const boxY = 165;
    const minX = 14;
    const maxX = 19;
    const scaleX = (val) => leftMargin + ((val - minX) / (maxX - minX)) * plotWidth;

    const xMin = scaleX(stats.min);
    const xMax = scaleX(stats.max);
    const xQ1 = scaleX(stats.Q1);
    const xQ2 = scaleX(stats.Q2);
    const xQ3 = scaleX(stats.Q3);

    // Đường râu (whiskers)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xMin, boxY);
    ctx.lineTo(xQ1, boxY);
    ctx.moveTo(xQ3, boxY);
    ctx.lineTo(xMax, boxY);
    // Chốt đầu mút
    ctx.moveTo(xMin, boxY - 8);
    ctx.lineTo(xMin, boxY + 8);
    ctx.moveTo(xMax, boxY - 8);
    ctx.lineTo(xMax, boxY + 8);
    ctx.stroke();

    // Hộp tứ phân vị (Q1 đến Q3)
    const boxH = 26;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fillRect(xQ1, boxY - boxH / 2, xQ3 - xQ1, boxH);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(xQ1, boxY - boxH / 2, xQ3 - xQ1, boxH);

    // Đường trung vị Q2
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xQ2, boxY - boxH / 2);
    ctx.lineTo(xQ2, boxY + boxH / 2);
    ctx.stroke();

    // Nhãn Box-plot
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Min=${stats.min}`, xMin, boxY + 22);
    ctx.fillText(`Q1=${stats.Q1.toFixed(2)}`, xQ1, boxY - 18);
    ctx.fillText(`Q2=${stats.Q2.toFixed(2)}`, xQ2, boxY + 22);
    ctx.fillText(`Q3=${stats.Q3.toFixed(2)}`, xQ3, boxY - 18);
    ctx.fillText(`Max=${stats.max}`, xMax, boxY + 22);

    // Cập nhật thẻ hiển thị số đo
    const metricsDiv = document.getElementById('tigerMetrics');
    if (metricsDiv) {
        metricsDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; font-size: 0.95rem;">
                <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px; border-left: 3px solid #6366f1;">
                    <div style="color: #94a3b8; font-size: 0.8rem;">Cỡ mẫu (n)</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #fff;">$n = ${stats.n}$</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px; border-left: 3px solid #06b6d4;">
                    <div style="color: #94a3b8; font-size: 0.8rem;">Khoảng biến thiên (R)</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #67e8f9;">$R = ${stats.R}$</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px; border-left: 3px solid #f59e0b;">
                    <div style="color: #94a3b8; font-size: 0.8rem;">Khoảng tứ phân vị ($\\Delta_Q$)</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #fde047;">$\\Delta_Q = ${stats.deltaQ.toFixed(3)}$</div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 8px; border-left: 3px solid #10b981;">
                    <div style="color: #94a3b8; font-size: 0.8rem;">Độ lệch chuẩn (s)</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #6ee7b7;">$s \\approx ${stats.stdDev.toFixed(2)}$</div>
                </div>
            </div>
        `;
        renderMathInTree(metricsDiv);
    }
}

// 9. LAB 2: SO SÁNH ĐỘ ỔN ĐỊNH HAI NGUỒN DỮ LIỆU
let currentLab2Preset = 'volt'; // 'volt' hoặc 'invest'

function drawCompareChart() {
    const canvas = document.getElementById('compareCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (currentLab2Preset === 'volt') {
        // Dữ liệu Vôn kế (Bài 3.17 SGK)
        // Vôn kế An: s nhỏ hơn, đường cong hẹp nhọn
        // Vôn kế Bình: s lớn hơn, đường cong trải rộng
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 160);
        ctx.lineTo(width - 30, 160);
        ctx.stroke();

        const meanX = width / 2;

        // Vẽ đường cong An (Độ lệch chuẩn nhỏ s = 0.85) - Màu Cyan
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 40; x <= width - 30; x += 4) {
            const dx = (x - meanX) / 25;
            const y = 160 - 120 * Math.exp(-0.5 * dx * dx);
            if (x === 40) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Vẽ đường cong Bình (Độ lệch chuẩn lớn s = 2.40) - Màu Tím Hồng
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 40; x <= width - 30; x += 4) {
            const dx = (x - meanX) / 65;
            const y = 160 - 55 * Math.exp(-0.5 * dx * dx);
            if (x === 40) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Trục trung bình 220V
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(meanX, 30);
        ctx.lineTo(meanX, 160);
        ctx.stroke();
        ctx.setLineDash([]);

        // Chú thích
        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vôn kế An (s = 0.85V - Rất ổn định)', meanX, 32);

        ctx.fillStyle = '#f472b6';
        ctx.fillText('Vôn kế Bình (s = 2.40V - Phân tán nhiều)', meanX, 95);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('220 V (Giá trị trung bình)', meanX, 180);

        const metricsDiv = document.getElementById('compareMetrics');
        if (metricsDiv) {
            metricsDiv.innerHTML = `
                <div style="background: rgba(6, 182, 212, 0.1); border-left: 4px solid #06b6d4; padding: 10px; border-radius: 8px;">
                    <p style="margin: 0; color: #e2e8f0; font-size: 0.95rem;">
                        <strong>🔍 Phân tích thực nghiệm (Bài 3.17 SGK):</strong> Cả An và Bình đều đo được điện thế trung bình là $\\bar{x} = 220\\text{ V}$. Tuy nhiên, độ lệch chuẩn của An ($s_{An} = 0{,}85\\text{ V}$) nhỏ hơn nhiều so với Bình ($s_{Binh} = 2{,}40\\text{ V}$). Điều này chứng minh <em>Vôn kế của An có sai số ngẫu nhiên rất nhỏ, kết quả đo lặp lại có độ ổn định và tin cậy cao hơn hẳn!</em>
                    </p>
                </div>
            `;
            renderMathInTree(metricsDiv);
        }
    } else {
        // Dữ liệu Đầu tư tài chính (Bài 3.15 SGK)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 160);
        ctx.lineTo(width - 30, 160);
        ctx.stroke();

        const meanX = width / 2;

        // Dự án A: s_A = 2.5% (ít rủi ro, phân bố hẹp quanh 12%) - Màu Xanh Ngọc
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 40; x <= width - 30; x += 4) {
            const dx = (x - meanX) / 30;
            const y = 160 - 110 * Math.exp(-0.5 * dx * dx);
            if (x === 40) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Dự án B: s_B = 6.8% (nhiều rủi ro, biến động mạnh) - Màu Vàng Cam
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 40; x <= width - 30; x += 4) {
            const dx = (x - meanX) / 75;
            const y = 160 - 50 * Math.exp(-0.5 * dx * dx);
            if (x === 40) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Chú thích
        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Quỹ A (s = 2.5% - Lợi nhuận ổn định, ít rủi ro)', meanX, 40);

        ctx.fillStyle = '#fde047';
        ctx.fillText('Quỹ B (s = 6.8% - Biến động lớn, rủi ro cao)', meanX, 100);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('12% (Lợi nhuận trung bình hàng năm)', meanX, 180);

        const metricsDiv = document.getElementById('compareMetrics');
        if (metricsDiv) {
            metricsDiv.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 10px; border-radius: 8px;">
                    <p style="margin: 0; color: #e2e8f0; font-size: 0.95rem;">
                        <strong>💼 Ứng dụng trong Tài chính & Đầu tư (Bài 3.15 SGK):</strong> Cả hai quỹ có cùng mức sinh lời kỳ vọng $\\bar{x} = 12\\%$/năm. Tuy nhiên Quỹ A có độ lệch chuẩn $s_A = 2{,}5\\%$ thấp hơn nhiều so với Quỹ B ($s_B = 6{,}8\\%$). Nhà đầu tư ngại rủi ro sẽ chọn Quỹ A vì biến động lợi nhuận quanh mức $12\\%$ rất nhỏ, an toàn hơn.
                    </p>
                </div>
            `;
            renderMathInTree(metricsDiv);
        }
    }
}

// 10. SETUP EVENT LISTENERS & NAVIGATION
function setupEvents() {
    // Tab switching
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = `tab-${tab.getAttribute('data-tab')}`;
            navTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                renderMathInTree(targetContent);
            }
            playClick();

            if (tab.getAttribute('data-tab') === 'theory') {
                unlockBadge(0);
            } else if (tab.getAttribute('data-tab') === 'labs') {
                unlockBadge(1);
                unlockBadge(2);
                setTimeout(() => {
                    drawTigerChart();
                    drawCompareChart();
                }, 50);
            }
        });
    });

    // Sound toggle
    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            appState.sound = !appState.sound;
            soundBtn.innerText = appState.sound ? "🔊 Âm thanh: BẬT" : "🔇 Âm thanh: TẮT";
            playClick();
        });
    }

    // Reset progress
    const resetBtn = document.getElementById('resetProgress');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập không?")) {
                appState.xp = 0;
                appState.streak = 0;
                appState.answered = {};
                appState.badges = [false, false, false, false, false];
                updateHud();
                initQuiz();
                for (let i = 1; i <= 5; i++) {
                    const b = document.getElementById(`badge-${i}`);
                    if (b) {
                        b.style.opacity = '0.4';
                        b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        b.style.boxShadow = 'none';
                    }
                }
                playClick();
            }
        });
    }

    // Avatar modal toggle
    const avatarBtn = document.getElementById('avatarBtn');
    const avatarModal = document.getElementById('avatarModal');
    const closeAvatar = document.getElementById('btnCloseAvatar');
    if (avatarBtn && avatarModal) {
        avatarBtn.addEventListener('click', () => {
            avatarModal.style.display = 'flex';
            playClick();
        });
    }
    if (closeAvatar && avatarModal) {
        closeAvatar.addEventListener('click', () => {
            avatarModal.style.display = 'none';
            playClick();
        });
    }

    // Avatar selections
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            appState.avatar = btn.getAttribute('data-avatar');
            appState.userName = btn.getAttribute('data-name');
            updateHud();
            if (avatarModal) avatarModal.style.display = 'none';
            playClick();
        });
    });

    // In giấy chứng nhận A4
    const printCertBtn = document.getElementById('btnPrintCert');
    if (printCertBtn) {
        printCertBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Lab 1 inputs
    for (let i = 0; i < 5; i++) {
        const inp = document.getElementById(`freq${i}`);
        if (inp) {
            inp.addEventListener('input', () => {
                drawTigerChart();
                unlockBadge(1);
            });
        }
    }

    const resetTigerBtn = document.getElementById('btnResetTigerData');
    if (resetTigerBtn) {
        resetTigerBtn.addEventListener('click', () => {
            for (let i = 0; i < 5; i++) {
                const inp = document.getElementById(`freq${i}`);
                if (inp) inp.value = tigerGroups[i].defaultFreq;
            }
            drawTigerChart();
            playClick();
        });
    }

    const allFourBtn = document.getElementById('btnAllFour');
    if (allFourBtn) {
        allFourBtn.addEventListener('click', () => {
            for (let i = 0; i < 5; i++) {
                const inp = document.getElementById(`freq${i}`);
                if (inp) inp.value = 4;
            }
            drawTigerChart();
            playClick();
        });
    }

    // Lab 2 presets
    const voltBtn = document.getElementById('btnVoltPreset');
    const investBtn = document.getElementById('btnInvestPreset');
    if (voltBtn) {
        voltBtn.addEventListener('click', () => {
            currentLab2Preset = 'volt';
            voltBtn.className = 'btn-primary';
            if (investBtn) investBtn.className = 'btn-secondary';
            drawCompareChart();
            unlockBadge(2);
            playClick();
        });
    }
    if (investBtn) {
        investBtn.addEventListener('click', () => {
            currentLab2Preset = 'invest';
            investBtn.className = 'btn-primary';
            if (voltBtn) voltBtn.className = 'btn-secondary';
            drawCompareChart();
            unlockBadge(2);
            playClick();
        });
    }
}

// 11. INITIALIZATION ON DOM LOADED
document.addEventListener('DOMContentLoaded', () => {
    updateHud();
    initQuiz();
    setupEvents();
    drawTigerChart();
    drawCompareChart();

    // Tự động quét toàn bộ công thức trên trang
    renderMathInTree(document.body);

    // Mở khóa Huy hiệu 1 mặc định khi đã tải xong phần lý thuyết
    setTimeout(() => {
        unlockBadge(0);
    }, 800);
});
