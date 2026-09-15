import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'exam_bank',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function run() {
    try {
        console.log("Seeding Interactive Lesson...");
        // 1. Find a unit in Grade 10 Math
        // Grades are 10, 11, 12. Let's find one.
        const [units] = await pool.query(`
            SELECT u.id, u.name 
            FROM units u
            JOIN chapters c ON u.chapter_id = c.id
            JOIN grades g ON c.grade_id = g.id
            WHERE g.code = '10' OR g.name LIKE '%10%' LIMIT 1
        `);

        if (units.length === 0) {
            console.log("No units found. Try running standard import first.");
            process.exit(1);
        }

        const unitId = units[0].id;
        console.log("Found unit:", units[0].name, "(ID: " + unitId + ")");

        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Luyện Tập Số Thập Phân</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .bg-animated {
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
        }

        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
    </style>
</head>
<body class="bg-animated min-h-screen flex items-center justify-center font-sans text-slate-800 p-4">

    <div class="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-6 sm:p-10 w-full max-w-2xl border border-white/50">
        
        <div class="text-center mb-8">
            <h1 class="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                <i class="fas fa-calculator mr-2"></i>Toán Số Thập Phân
            </h1>
            <p class="text-slate-500 font-medium">Luyện tập phép tính với phần nguyên và thập phân tối đa 3 chữ số</p>
        </div>

        <div class="mb-8">
            <p class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Chọn phép toán cần luyện tập:</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label class="cursor-pointer">
                    <input type="checkbox" id="op-add" class="hidden peer" checked onchange="validateCheckboxes()">
                    <div class="p-3 border-2 border-slate-200 rounded-xl peer-checked:border-blue-500 peer-checked:bg-blue-50 text-center font-bold text-slate-500 peer-checked:text-blue-600 transition-all hover:border-blue-300">
                        <i class="fas fa-plus mr-1"></i> Cộng
                    </div>
                </label>
                <label class="cursor-pointer">
                    <input type="checkbox" id="op-sub" class="hidden peer" checked onchange="validateCheckboxes()">
                    <div class="p-3 border-2 border-slate-200 rounded-xl peer-checked:border-red-500 peer-checked:bg-red-50 text-center font-bold text-slate-500 peer-checked:text-red-600 transition-all hover:border-red-300">
                        <i class="fas fa-minus mr-1"></i> Trừ
                    </div>
                </label>
                <label class="cursor-pointer">
                    <input type="checkbox" id="op-mul" class="hidden peer" checked onchange="validateCheckboxes()">
                    <div class="p-3 border-2 border-slate-200 rounded-xl peer-checked:border-green-500 peer-checked:bg-green-50 text-center font-bold text-slate-500 peer-checked:text-green-600 transition-all hover:border-green-300">
                        <i class="fas fa-times mr-1"></i> Nhân
                    </div>
                </label>
                <label class="cursor-pointer">
                    <input type="checkbox" id="op-div" class="hidden peer" checked onchange="validateCheckboxes()">
                    <div class="p-3 border-2 border-slate-200 rounded-xl peer-checked:border-purple-500 peer-checked:bg-purple-50 text-center font-bold text-slate-500 peer-checked:text-purple-600 transition-all hover:border-purple-300">
                        <i class="fas fa-divide mr-1"></i> Chia
                    </div>
                </label>
            </div>
        </div>

        <div class="bg-slate-50 rounded-2xl p-6 sm:p-8 shadow-inner flex flex-col items-center relative overflow-hidden">
            <div id="transition-overlay" class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center transition-opacity duration-300 opacity-0 pointer-events-none">
                <i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
            </div>

            <div class="font-mono text-5xl sm:text-6xl font-bold tracking-widest text-slate-700 flex flex-col items-end w-max mx-auto mb-6">
                <div class="pr-2 sm:pr-4 text-blue-600 w-full text-right" id="operand1">12,345</div>
                <div class="pr-2 sm:pr-4 pb-4 border-b-4 border-slate-400 w-full min-w-[220px] sm:min-w-[280px] flex justify-between items-end">
                    <span class="text-slate-400" id="operator">+</span>
                    <span class="text-indigo-600 text-right" id="operand2">6,780</span>
                </div>
                
                <form id="answer-form" class="mt-4 w-full relative z-20">
                    <input 
                        type="text" 
                        id="answer-input" 
                        inputmode="decimal"
                        class="text-4xl sm:text-5xl font-bold font-mono text-right w-full pr-2 sm:pr-4 py-2 border-b-4 border-slate-300 focus:border-blue-500 bg-transparent outline-none transition-colors text-slate-800 placeholder-slate-300"
                        autocomplete="off"
                        placeholder="?"
                    >
                </form>
            </div>

            <button type="submit" form="answer-form" class="w-full sm:w-64 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center justify-center z-20">
                <i class="fas fa-check-circle mr-2"></i> Kiểm tra
            </button>

            <button type="button" id="skip-btn" onclick="skipProblem()" class="mt-6 text-slate-400 hover:text-slate-600 font-medium underline transition-colors z-20">
                Bỏ qua câu này
            </button>

            <div id="feedback" class="mt-6 p-4 rounded-xl text-lg font-bold transition-all hidden w-full text-center z-20">
            </div>
        </div>

        <div class="mt-8 flex justify-between items-center border-t border-slate-100 pt-6">
            <div class="text-center w-1/2 border-r border-slate-100">
                <p class="text-slate-400 text-sm font-bold uppercase mb-1">Số câu đúng</p>
                <p class="text-3xl font-black text-green-500" id="score-correct">0</p>
            </div>
            <div class="text-center w-1/2">
                <p class="text-slate-400 text-sm font-bold uppercase mb-1">Tổng số câu</p>
                <p class="text-3xl font-black text-blue-500" id="score-total">0</p>
            </div>
        </div>
    </div>

    <script>
        let currentAnswer = 0;
        let scoreCorrect = 0;
        let scoreTotal = 0;
        let isProcessing = false;

        function formatVN(num) {
            return num.toString().replace('.', ',');
        }

        function parseVN(str) {
            return parseFloat(str.replace(',', '.'));
        }

        function validateCheckboxes() {
            const ops = ['op-add', 'op-sub', 'op-mul', 'op-div'];
            const checkedCount = ops.filter(id => document.getElementById(id).checked).length;
            if (checkedCount === 0) {
                document.getElementById('op-add').checked = true;
            }
        }

        function randNumber(maxIntDigits, maxDecDigits) {
            const intLength = Math.floor(Math.random() * maxIntDigits) + 1;
            const decLength = Math.floor(Math.random() * maxDecDigits) + 1;

            let intPart = Math.floor(Math.random() * Math.pow(10, intLength));
            
            let decPart = Math.floor(Math.random() * (Math.pow(10, decLength) - 1)) + 1;
            let decPartStr = decPart.toString().padStart(decLength, '0');

            return parseFloat(\`\${intPart}.\${decPartStr}\`);
        }

        function generateProblem() {
            isProcessing = false;
            document.getElementById('feedback').classList.add('hidden');
            document.getElementById('answer-input').value = '';
            document.getElementById('answer-input').focus();
            document.getElementById('answer-input').disabled = false;
            document.querySelector('button[type="submit"]').disabled = false;

            const selectedOps = [];
            if(document.getElementById('op-add').checked) selectedOps.push({ type: '+', symbol: '+' });
            if(document.getElementById('op-sub').checked) selectedOps.push({ type: '-', symbol: '−' });
            if(document.getElementById('op-mul').checked) selectedOps.push({ type: '*', symbol: '×' });
            if(document.getElementById('op-div').checked) selectedOps.push({ type: '/', symbol: '÷' });

            const op = selectedOps[Math.floor(Math.random() * selectedOps.length)];
            let a, b, answer;

            switch(op.type) {
                case '+':
                    a = randNumber(3, 3);
                    b = randNumber(3, 3);
                    answer = parseFloat((a + b).toFixed(4));
                    break;
                case '-':
                    a = randNumber(3, 3);
                    b = randNumber(3, 3);
                    if (a < b) { let temp = a; a = b; b = temp; }
                    answer = parseFloat((a - b).toFixed(4));
                    break;
                case '*':
                    a = randNumber(2, 2);
                    b = randNumber(1, 1);
                    answer = parseFloat((a * b).toFixed(3));
                    break;
                case '/':
                    answer = randNumber(2, 1);
                    b = randNumber(1, 1);
                    if (b === 0) b = 1.5;
                    a = parseFloat((answer * b).toFixed(3));
                    break;
            }

            currentAnswer = answer;
            
            let strA = formatVN(a);
            let strB = formatVN(b);

            if (op.type === '+' || op.type === '-') {
                let decA = strA.split(',')[1] || '';
                let decB = strB.split(',')[1] || '';
                let maxDec = Math.max(decA.length, decB.length);
                
                if (maxDec > 0) {
                    if (!strA.includes(',')) strA += ',';
                    strA += '0'.repeat(maxDec - decA.length);
                    
                    if (!strB.includes(',')) strB += ',';
                    strB += '0'.repeat(maxDec - decB.length);
                }
            }

            document.getElementById('operand1').innerText = strA;
            document.getElementById('operand2').innerText = strB;
            document.getElementById('operator').innerText = op.symbol;
        }

        function skipProblem() {
            if (isProcessing) return;
            showFeedback(\`Đã bỏ qua! Đáp án đúng là: \${formatVN(currentAnswer)}\`, 'warning');
            setTimeout(generateProblem, 2000);
        }

        function showFeedback(message, type) {
            isProcessing = true;
            document.getElementById('answer-input').disabled = true;
            document.querySelector('button[type="submit"]').disabled = true;

            const feedbackEl = document.getElementById('feedback');
            feedbackEl.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-yellow-100', 'text-yellow-700');
            
            if (type === 'success') {
                feedbackEl.innerHTML = \`<i class="fas fa-check-circle mr-2 text-2xl align-middle"></i>\${message}\`;
                feedbackEl.classList.add('bg-green-100', 'text-green-700');
            } else if (type === 'error') {
                feedbackEl.innerHTML = \`<i class="fas fa-times-circle mr-2 text-2xl align-middle"></i>\${message}\`;
                feedbackEl.classList.add('bg-red-100', 'text-red-700');
            } else {
                feedbackEl.innerHTML = \`<i class="fas fa-exclamation-triangle mr-2 text-2xl align-middle"></i>\${message}\`;
                feedbackEl.classList.add('bg-yellow-100', 'text-yellow-700');
            }
        }

        document.getElementById('answer-input').addEventListener('input', function(e) {
            let val = this.value;
            val = val.replace(/\\./g, ',');
            val = val.replace(/[^0-9,-]/g, '');
            const parts = val.split(',');
            if (parts.length > 2) {
                val = parts[0] + ',' + parts.slice(1).join('');
            }
            this.value = val;
        });

        document.getElementById('answer-form').addEventListener('submit', function(e) {
            e.preventDefault();
            if (isProcessing) return;

            const inputVal = document.getElementById('answer-input').value.trim();
            if (!inputVal) {
                document.getElementById('answer-input').focus();
                return;
            }

            const userAns = parseVN(inputVal);
            if (isNaN(userAns)) return;

            scoreTotal++;
            
            if (Math.abs(userAns - currentAnswer) < 0.0001) {
                scoreCorrect++;
                showFeedback('Xuất sắc! Trả lời chính xác.', 'success');
                // NOTIFY PARENT APP OF PROGRESS
                window.parent.postMessage({ type: 'LESSON_COMPLETE', score: scoreCorrect }, '*');
                
                setTimeout(generateProblem, 1500);
            } else {
                showFeedback(\`Sai rồi! Đáp án đúng là: <strong>\${formatVN(currentAnswer)}</strong>\`, 'error');
                setTimeout(generateProblem, 2500);
            }

            document.getElementById('score-correct').innerText = scoreCorrect;
            document.getElementById('score-total').innerText = scoreTotal;
        });

        window.onload = generateProblem;
    </script>
</body>
</html>`;

        await pool.query("INSERT INTO lesson_sections (unit_id, title, content, video_url, interactive_html, order_index) VALUES (?, ?, ?, ?, ?, ?)", [
            unitId,
            "1. Lý thuyết và Luyện tập Tương tác Số Thập Phân",
            "**Số thập phân** là... \n\nHãy xem video bài giảng và thực hiện bài tập tương tác phía dưới để ghi nhớ kiến thức tốt nhất.",
            "https://www.youtube.com/embed/dQw4w9WgXcQ", // dummy video
            html,
            1
        ]);

        console.log("Seeded successfully!");

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
