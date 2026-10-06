import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { OnlineQuestion, QuestionType } from '../types';
import { parseLessonPracticeQuestion, lessonPracticeCorrect } from '../utils/lessonPractice';
import { prepareMatrixPayload } from '../utils/matrixUtils';
import { parseMatrixData } from '../../shared/matrixCatalog';
import { MathRenderer } from './MathRenderer';
import { Loader2, RefreshCw } from 'lucide-react';

// Self-check inside a lesson, not a scored exam submission or adaptive evidence.
export const LessonPractice: React.FC<{ unitId: number; matrixId?: number | null }> = ({ unitId, matrixId }) => {
    const [questions, setQuestions] = useState<OnlineQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<number, string | Record<string, boolean>>>({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true); setQuestions([]); setAnswers({}); setSubmitted(false); setError('');
        const load = async () => {
            try {
                let rows;
                if (matrixId) {
                    const matrices = await apiService.fetchSavedMatrices();
                    const matrix = matrices.find(m => Number(m.id) === Number(matrixId));
                    if (!matrix) throw new Error('Không truy cập được ma trận luyện tập. Giáo viên cần kiểm tra trạng thái công khai.');
                    rows = await apiService.generateOnlineExam(prepareMatrixPayload(parseMatrixData(matrix.matrix_data)));
                } else rows = await apiService.fetchUnitPractice(unitId);
                const parsed = rows.map(parseLessonPracticeQuestion);
                if (active) setQuestions(parsed);
            } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Không tải được bài luyện tập.'); }
            finally { if (active) setLoading(false); }
        };
        void load(); return () => { active = false; };
    }, [unitId, matrixId, reload]);
    const correct = (q: OnlineQuestion): boolean | null => {
        return lessonPracticeCorrect(q, answers[q.id]);
    };
    const scoreable = questions.filter(q => correct(q) !== null);
    return <section className="bg-white rounded-2xl border p-5 space-y-5"><div className="flex justify-between items-center gap-3"><div><h3 className="font-bold text-lg">Luyện tập ngay</h3><p className="text-xs text-slate-500 mt-1">Tự kiểm tra sau bài học · Không tính vào điểm kiểm tra chính thức.</p></div><button disabled={loading} onClick={() => setReload(n => n + 1)} className="flex gap-1 items-center text-xs font-semibold text-indigo-600"><RefreshCw size={14}/>{error ? 'Thử lại' : 'Bộ câu mới'}</button></div>
        {loading ? <div role="status" className="py-8 flex gap-2 justify-center"><Loader2 className="animate-spin"/>Đang tải câu hỏi…</div> : error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : !questions.length ? <p className="text-sm text-slate-500">Ngân hàng chưa có câu hỏi phù hợp cho bài này.</p> : <>
            {submitted && <div role="status" className="p-4 rounded-xl bg-indigo-50 text-indigo-800 text-sm">Đúng {questions.filter(q => correct(q) === true).length}/{scoreable.length} câu có đáp án tự kiểm tra. {questions.length > scoreable.length && `${questions.length - scoreable.length} câu cần tự đối chiếu lời giải.`}</div>}
            {questions.map((q, index) => <article key={q.id} className="border-t pt-5 space-y-3"><h4 className="text-xs font-bold text-indigo-600">Câu {index + 1} · {q.type}</h4><MathRenderer content={q.content} mode="question" renderChoices={false} hideToolbar/>
                {q.type === QuestionType.TN && q.options.map((option, i) => <label key={option.id} className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${answers[q.id] === option.id ? 'bg-indigo-50 border-indigo-300' : 'border-slate-200'}`}><input type="radio" name={`lesson-${unitId}-${matrixId}-${q.id}`} checked={answers[q.id] === option.id} disabled={submitted} onChange={() => setAnswers(a => ({ ...a, [q.id]: option.id }))}/><span className="font-semibold text-xs">{String.fromCharCode(65 + i)}.</span><div className="min-w-0 flex-1"><MathRenderer content={option.content} hideToolbar/></div></label>)}
                {q.type === QuestionType.TF && q.options.map((option, i) => <div key={option.id} className="rounded-xl border p-3 space-y-2"><div className="flex gap-2"><span className="text-xs font-bold">{String.fromCharCode(97 + i)}.</span><MathRenderer content={option.content} hideToolbar/></div><div className="flex gap-4">{[true, false].map(value => <label key={String(value)} className="flex items-center gap-2 text-sm"><input type="radio" name={`lesson-${unitId}-${matrixId}-${q.id}-${option.id}`} disabled={submitted} checked={typeof answers[q.id] === 'object' && (answers[q.id] as Record<string, boolean>)[option.id] === value} onChange={() => setAnswers(a => ({ ...a, [q.id]: { ...(typeof a[q.id] === 'object' ? a[q.id] as Record<string, boolean> : {}), [option.id]: value } }))}/>{value ? 'Đúng' : 'Sai'}</label>)}</div></div>)}
                {[QuestionType.KQ, QuestionType.TL].includes(q.type) && <input aria-label={`Trả lời câu ${index + 1}`} type="text" value={typeof answers[q.id] === 'string' ? answers[q.id] as string : ''} disabled={submitted} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} placeholder="Nhập câu trả lời" className="w-full border rounded-xl p-3 text-sm"/>}
                {submitted && <div className={`p-4 rounded-xl space-y-2 ${correct(q) === true ? 'bg-emerald-50' : 'bg-amber-50'}`}><p className="text-sm font-bold">{correct(q) === true ? 'Chính xác' : correct(q) === false ? 'Chưa đúng · Đối chiếu đáp án' : 'Tự đối chiếu lời giải'}</p>{q.type === QuestionType.TN && <p className="text-sm">Đáp án: {q.options.map((o, i) => o.isCorrect ? String.fromCharCode(65 + i) : '').filter(Boolean).join(', ') || 'Chưa có'}</p>}{q.type === QuestionType.TF && <p className="text-sm">{q.options.map((o, i) => `${String.fromCharCode(97+i)}: ${o.isCorrect ? 'Đúng' : 'Sai'}`).join(' · ')}</p>}{q.correctAnswer && <MathRenderer content={`$${q.correctAnswer}$`} hideToolbar/>}{q.solution ? <MathRenderer content={q.solution} mode="all" hideToolbar/> : <p className="text-xs text-slate-500">Câu này chưa có lời giải chi tiết.</p>}</div>}
            </article>)}
            {!submitted && <button onClick={() => setSubmitted(true)} className="bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-bold">Kiểm tra đáp án & xem lời giải</button>}
        </>}
    </section>;
};
