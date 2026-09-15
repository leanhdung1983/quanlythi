export function checkShortAnswer(userAnswer, correctAnswer) {
    if (userAnswer === undefined || userAnswer === null || correctAnswer === undefined || correctAnswer === null) return false;
    const normalizedUser = String(userAnswer).trim().replace(/\s+/g, '').replace(/,/g, '.').toLowerCase();
    if (!normalizedUser) return false;
    const acceptedAnswers = String(correctAnswer).trim().replace(/[{}]/g, '').toLowerCase().split(';');

    return acceptedAnswers.some(answer => {
        const normalizedCorrect = answer.replace(/\s+/g, '').replace(/,/g, '.');
        if (!normalizedCorrect) return false;
        const userNumber = Number(normalizedUser);
        const correctNumber = Number(normalizedCorrect);
        if (Number.isFinite(userNumber) && Number.isFinite(correctNumber)) return userNumber === correctNumber;
        return normalizedUser === normalizedCorrect;
    });
}

export function calculateServerScore(questions, answers = {}, settings = {}) {
    if (!Array.isArray(questions) || questions.length === 0 || !answers || typeof answers !== 'object') return 0;
    const countByType = type => questions.filter(question => question?.type === type).length;
    const countTN = countByType('TN');
    const countTF = countByType('TF');
    const countKQ = countByType('KQ');
    const gradedCount = countTN + countTF + countKQ;
    const pointsFor = (type, count) => {
        const total = Number(settings[`total_points_${type}`]) || 0;
        const perQuestion = Number(settings[`points_${type}`]);
        if (total > 0 && count > 0) return total / count;
        if (Number.isFinite(perQuestion) && perQuestion > 0) return perQuestion;
        return count > 0 && gradedCount > 0 ? 10 / gradedCount : 0;
    };
    const pTN = pointsFor('tn', countTN);
    const pTF = pointsFor('tf', countTF);
    const pKQ = pointsFor('kq', countKQ);
    const tfMode = settings.tf_scoring_mode || '10-25-50-100';
    let totalPoints = 0;

    for (const question of questions) {
        const userAnswer = answers[question.id];
        if (question.type === 'TN') {
            const correctOption = question.options?.find(option => option?.isCorrect === true);
            if (correctOption && String(userAnswer) === String(correctOption.id)) totalPoints += pTN;
        } else if (question.type === 'TF' && userAnswer && typeof userAnswer === 'object') {
            const options = Array.isArray(question.options) ? question.options : [];
            const correctCount = options.reduce((count, option) => count + (userAnswer[option.id] === option.isCorrect ? 1 : 0), 0);
            if (correctCount === options.length && options.length > 0) totalPoints += pTF;
            else if (correctCount === 3) totalPoints += tfMode === '10-25-50-100' ? pTF * 0.5 : tfMode === '0-0-0-100' ? 0 : pTF * 0.75;
            else if (correctCount === 2) totalPoints += tfMode === '10-25-50-100' ? pTF * 0.25 : tfMode === '0-0-0-100' ? 0 : pTF * 0.5;
            else if (correctCount === 1) totalPoints += tfMode === '10-25-50-100' ? pTF * 0.1 : tfMode === '0-0-0-100' ? 0 : pTF * 0.25;
        } else if (question.type === 'KQ' && checkShortAnswer(userAnswer, question.correctAnswer)) {
            totalPoints += pKQ;
        }
    }

    const configuredMax = Number(settings.total_points_tn || 0) + Number(settings.total_points_tf || 0) + Number(settings.total_points_kq || 0);
    if (configuredMax === 0) {
        const possible = countTN * pTN + countTF * pTF + countKQ * pKQ;
        totalPoints = possible > 0 ? totalPoints / possible * 10 : 0;
    }
    return Math.round(Math.max(0, Math.min(10, totalPoints)) * 100) / 100;
}
