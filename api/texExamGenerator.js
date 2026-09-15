/**
 * Generator for Vietnamese High School Exam LaTeX files (.tex)
 * Following the latest Ministry of Education (BGD&ĐT) guidelines (Decision 764/QĐ-BGDĐT from 2025)
 * Fully compatible with template/Main-Soan-2025.tex and template/ex_test.sty.
 */

/**
 * Extract answer letter (A, B, C, D) for a TN question containing \choice
 */
export function extractChoiceAnswer(content) {
    if (!content) return '';
    
    // Pattern: \choice {opt1} {opt2} {opt3} {opt4}
    const choiceMatch = content.match(/\\choice\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}/);
    if (choiceMatch) {
        for (let i = 1; i <= 4; i++) {
            if (choiceMatch[i].includes('\\True')) {
                return ['A', 'B', 'C', 'D'][i - 1];
            }
        }
    }
    
    // Fallback: check where \True appears relative to \choice
    const choiceIdx = content.indexOf('\\choice');
    if (choiceIdx !== -1) {
        const afterChoice = content.slice(choiceIdx);
        const trueIdx = afterChoice.indexOf('\\True');
        if (trueIdx !== -1) {
            // Count open braces before \True
            const beforeTrue = afterChoice.slice(0, trueIdx);
            const openBraces = (beforeTrue.match(/\{/g) || []).length;
            const closeBraces = (beforeTrue.match(/\}/g) || []).length;
            const optionIndex = openBraces - closeBraces;
            if (optionIndex >= 0 && optionIndex < 4) {
                return ['A', 'B', 'C', 'D'][optionIndex];
            }
        }
    }
    
    return '';
}

/**
 * Extract True/False choices for TF questions (Part II)
 */
export function extractTFAnswer(content) {
    if (!content) return '';
    const res = [];
    const labels = ['a', 'b', 'c', 'd'];
    
    for (const l of labels) {
        const reg = new RegExp(`\\\\item\\s*\\(?${l}\\)?[\\s\\S]*?(\\\\True|\\\\False)`, 'i');
        const m = content.match(reg);
        if (m) {
            res.push(`${l}: ${m[1].includes('\\True') ? 'Đ' : 'S'}`);
        }
    }
    return res.length > 0 ? res.join(' | ') : '';
}

/**
 * Clean and format an individual LaTeX question item, preserving ID6 tags
 */
export function formatQuestionLatex(rawLatex, globalNumber, mode = 'EXAM') {
    if (!rawLatex) return '';
    let latex = rawLatex.trim();

    // Extract ID6 tag if present (e.g. %[0D1N1-3] or %[2D1H1-2])
    let idTag = '';
    const idMatch = latex.match(/^\\begin\{(?:ex|bt)\}\s*(%\[.*?\])/);
    if (idMatch) {
        idTag = idMatch[1];
    }

    // Remove outermost \begin{ex}... and \end{ex}
    latex = latex.replace(/^\\begin\{(?:ex|bt)\}(?:\%\[.*?\])?/s, '').trim();
    latex = latex.replace(/\\end\{(?:ex|bt)\}$/s, '').trim();

    // Remove watermark comments
    latex = latex.replace(/\%<MyLT>/g, '').trim();

    // Reconstruct with standardized ex environment
    const headerComment = idTag ? `${idTag}` : `% Câu ${globalNumber}`;
    return `\\begin{ex}${headerComment}\n${latex}\n\\end{ex}\n`;
}

/**
 * Generate a LaTeX document fully compliant with template/Main-Soan-2025.tex
 * Allows direct \input{} without any errors or additional package declarations,
 * while remaining fully standalone-compilable when opened directly in a TeX editor.
 */
export function buildLatexDocument({
    questionsByType,
    title = 'ĐỀ KIỂM TRA ĐỊNH KỲ',
    grade = 12,
    subject = 'Toán học',
    duration = 90,
    mode = 'EXAM',
    schoolName = 'TRƯỜNG THPT CHUYÊN'
}) {
    const isSolution = mode === 'SOLUTION';
    const tnQuestions = questionsByType.TN || [];
    const tfQuestions = questionsByType.TF || [];
    const kqQuestions = questionsByType.KQ || [];
    const tlQuestions = questionsByType.TL || [];

    const gradeLabel = grade === 0 || grade === '0' || grade === 10 ? '10' :
                       grade === 1 || grade === '1' || grade === 11 ? '11' :
                       grade === 2 || grade === '2' || grade === 12 ? '12' : grade;

    let doc = `% ==============================================================================
% ĐỀ THI ĐƯỢC XUẤT TỰ ĐỘNG TỪ NGÂN HÀNG CÂU HỎI ID6
% DÙNG TRỰC TIẾP VỚI template/Main-Soan-2025.tex VÀ GÓI LỆNH ex_test.sty
% Thầy/cô chỉ cần gọi: \\input{<tên_file>} trong file main là chạy ngay, không cần khai báo gì khác.
% Thời gian tạo: ${new Date().toLocaleString('vi-VN')}
% ==============================================================================

\\begin{name}{MÔN ${subject.toUpperCase()} - LỚP ${gradeLabel}}{${title}}
\\end{name}

`;

    let globalCounter = 1;
    const answerKeys = [];

    // --- PHẦN 1: TRẮC NGHIỆM 4 PHƯƠNG ÁN ---
    if (tnQuestions.length > 0) {
        doc += `% ==============================================================================
% PHẦN 1: TRẮC NGHIỆM 4 PHƯƠNG ÁN
% ==============================================================================
\\cautn
`;
        tnQuestions.forEach((q) => {
            const raw = q.content_latex_original || q.content_latex || q.original_latex || q.raw_latex || '';
            const key = extractChoiceAnswer(raw);
            answerKeys.push({ num: globalCounter, type: 'TN', key: key || '?' });

            doc += formatQuestionLatex(raw, globalCounter, mode);
            globalCounter++;
        });
        doc += `\n`;
    }

    // --- PHẦN 2: TRẮC NGHIỆM ĐÚNG SAI ---
    if (tfQuestions.length > 0) {
        doc += `% ==============================================================================
% PHẦN 2: TRẮC NGHIỆM ĐÚNG SAI
% ==============================================================================
\\cauds
`;
        tfQuestions.forEach((q) => {
            const raw = q.content_latex_original || q.content_latex || q.original_latex || q.raw_latex || '';
            const key = extractTFAnswer(raw);
            answerKeys.push({ num: globalCounter, type: 'TF', key: key || 'a: ?, b: ?, c: ?, d: ?' });

            doc += formatQuestionLatex(raw, globalCounter, mode);
            globalCounter++;
        });
        doc += `\n`;
    }

    // --- PHẦN 3: TRẢ LỜI NGẮN ---
    if (kqQuestions.length > 0) {
        doc += `% ==============================================================================
% PHẦN 3: TRẢ LỜI NGẮN
% ==============================================================================
\\caukq
`;
        kqQuestions.forEach((q) => {
            const raw = q.content_latex_original || q.content_latex || q.original_latex || q.raw_latex || '';
            answerKeys.push({ num: globalCounter, type: 'KQ', key: 'Đáp số' });

            doc += formatQuestionLatex(raw, globalCounter, mode);
            globalCounter++;
        });
        doc += `\n`;
    }

    // --- PHẦN 4: TỰ LUẬN (NẾU CÓ) ---
    if (tlQuestions.length > 0) {
        doc += `% ==============================================================================
% PHẦN 4: TỰ LUẬN
% ==============================================================================
\\cautl
`;
        tlQuestions.forEach((q) => {
            const raw = q.content_latex_original || q.content_latex || q.original_latex || q.raw_latex || '';
            answerKeys.push({ num: globalCounter, type: 'TL', key: 'Tự luận' });

            doc += formatQuestionLatex(raw, globalCounter, mode);
            globalCounter++;
        });
        doc += `\n`;
    }

    doc += `\\begin{center}
    \\textbf{--------- HẾT ---------}
\\end{center}
`;

    return doc;
}
