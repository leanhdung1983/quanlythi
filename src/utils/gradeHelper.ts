export const checkKQAnswer = (userAns: any, correctAns: any): boolean => {
    if (!userAns || !correctAns) return false;
    const normU = userAns.toString().trim().replace(/\s+/g, '').replace(/,/g, '.').toLowerCase();
    const corrects = correctAns.toString().trim().replace(/[\{\}]/g, '').toLowerCase().split(';');
    for (const cAns of corrects) {
        const normC = cAns.replace(/\s+/g, '').replace(/,/g, '.');
        const numU = Number(normU);
        const numC = Number(normC);
        if (!isNaN(numU) && !isNaN(numC) && normU !== "" && normC !== "") {
            if (numU === numC) return true;
        } else if (normU === normC) {
            return true;
        }
    }
    return false;
};

export interface ExamScoringSettings {
    total_points_tn?: number | string;
    points_tn?: number | string;
    total_points_tf?: number | string;
    points_tf?: number | string;
    total_points_kq?: number | string;
    points_kq?: number | string;
    tf_scoring_mode?: '10-25-50-100' | '0-0-0-100' | 'linear' | string;
}

export const calculateExamScore = (
    questions: any[],
    answers: Record<string, any>,
    settings?: ExamScoringSettings
): number => {
    const countTN = questions.filter(q => q.type === 'TN').length;
    const countTF = questions.filter(q => q.type === 'TF').length;
    const countKQ = questions.filter(q => q.type === 'KQ').length;

    let pTN = 0, pTF = 0, pKQ = 0;
    
    const tTN = Number(settings?.total_points_tn) || 0;
    const ptTN = Number(settings?.points_tn);
    if (tTN > 0 && countTN > 0) pTN = tTN / countTN;
    else if (!isNaN(ptTN) && ptTN > 0) pTN = ptTN;
    else pTN = countTN > 0 ? (10 / (countTN + countTF + countKQ)) : 0;
    
    const tTF = Number(settings?.total_points_tf) || 0;
    const ptTF = Number(settings?.points_tf);
    if (tTF > 0 && countTF > 0) pTF = tTF / countTF;
    else if (!isNaN(ptTF) && ptTF > 0) pTF = ptTF;
    else pTF = countTF > 0 ? (10 / (countTN + countTF + countKQ)) : 0;
    
    const tKQ = Number(settings?.total_points_kq) || 0;
    const ptKQ = Number(settings?.points_kq);
    if (tKQ > 0 && countKQ > 0) pKQ = tKQ / countKQ;
    else if (!isNaN(ptKQ) && ptKQ > 0) pKQ = ptKQ;
    else pKQ = countKQ > 0 ? (10 / (countTN + countTF + countKQ)) : 0;
    
    const tfMode = settings?.tf_scoring_mode || '10-25-50-100';

    let totalPoints = 0;
    questions.forEach(q => {
        const userAns = answers[q.id];
        
        if (q.type === 'TN') {
            if (userAns === q.options?.find((o: any) => o.isCorrect)?.id) totalPoints += pTN;
        } else if (q.type === 'TF' && userAns) {
            let correctCount = 0; 
            q.options?.forEach((o: any) => { if (userAns[o.id] === o.isCorrect) correctCount++; });
            
            if (correctCount === 4) totalPoints += pTF;
            else if (correctCount === 3) {
                if (tfMode === '10-25-50-100') totalPoints += pTF * 0.5;
                else if (tfMode === '0-0-0-100') totalPoints += 0;
                else totalPoints += pTF * 0.75;
            }
            else if (correctCount === 2) {
                if (tfMode === '10-25-50-100') totalPoints += pTF * 0.25;
                else if (tfMode === '0-0-0-100') totalPoints += 0;
                else totalPoints += pTF * 0.5;
            }
            else if (correctCount === 1) {
                if (tfMode === '10-25-50-100') totalPoints += pTF * 0.1;
                else if (tfMode === '0-0-0-100') totalPoints += 0;
                else totalPoints += pTF * 0.25;
            }
        } else if (q.type === 'KQ') {
            if (checkKQAnswer(userAns, q.correctAnswer)) totalPoints += pKQ;
        }
    });

    let finalScore = totalPoints;
    const configuredMax = Number(settings?.total_points_tn || 0) + Number(settings?.total_points_tf || 0) + Number(settings?.total_points_kq || 0);
    if (configuredMax === 0) {
        const totalPossible = (countTN * pTN) + (countTF * pTF) + (countKQ * pKQ);
        if (totalPossible > 0) finalScore = (totalPoints / totalPossible) * 10;
        else finalScore = 0;
    }
    return Math.round(finalScore * 100) / 100;
};

