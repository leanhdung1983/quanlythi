import { OnlineQuestion, QuestionType } from '../types';
import { parseQuestionContent } from './latexParser';
import { checkKQAnswer } from './gradeHelper';
export type LessonAnswer = string | Record<string, boolean> | undefined;
type PracticeRow = Partial<OnlineQuestion> & { type_code?: string; content_latex?: string; content_latex_original?: string };
export function parseLessonPracticeQuestion(q: PracticeRow): OnlineQuestion {
    return parseQuestionContent({ ...q, type: (q.type || q.type_code) as QuestionType, content: q.content || q.content_latex || q.raw_latex || '', original_latex: q.original_latex || q.content_latex_original, options: q.options || [] } as OnlineQuestion);
}
export function lessonPracticeCorrect(q: OnlineQuestion, answer: LessonAnswer): boolean | null {
    if (q.type === QuestionType.TN) { const key = q.options.find(o => o.isCorrect); return key ? answer === key.id : null; }
    if (q.type === QuestionType.TF) return q.options.length ? q.options.every(o => typeof answer === 'object' && answer[o.id] === o.isCorrect) : null;
    if (q.type === QuestionType.KQ && q.correctAnswer) return typeof answer === 'string' && checkKQAnswer(answer, q.correctAnswer);
    return null;
}
