import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { prepareMatrixPayload } from '../utils/matrixUtils';
import { MathRenderer } from './MathRenderer';

export const DynamicPractice: React.FC<{ unitId: number, matrixId?: number | null }> = ({ unitId, matrixId }) => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [submitted, setSubmitted] = useState(false);

    
    useEffect(() => {
        let isMounted = true;
        const loadPractice = async () => {
            setLoading(true);
            try {
                if (matrixId) {
                    const matrices = await apiService.fetchSavedMatrices();
                    const matrix = matrices.find(m => m.id === matrixId);
                    if (!matrix) throw new Error("Không tìm thấy ma trận ôn tập");
                    const payload = prepareMatrixPayload(matrix.matrix_data);
                    const data = await apiService.generateOnlineExam(payload);
                    if (!isMounted) return;
                    const mapped = data.map(q => ({
                        id: q.id,
                        content_latex: q.content || q.raw_latex,
                        content_latex_original: q.original_latex || q.raw_latex,
                        type_code: q.type
                    }));
                    setQuestions(mapped);
                } else {
                    const data = await apiService.fetchUnitPractice(unitId);
                    if (!isMounted) return;
                    setQuestions(data);
                }
            } catch (err: any) {
                console.error(err);
                alert("Không thể tải bài tập: " + (err.message || 'Lỗi'));
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadPractice();
        return () => {
            isMounted = false;
        };
    }, [unitId, matrixId]);


    const handleTNChange = (qId: number, answerText: string) => {
        setAnswers(prev => ({ ...prev, [qId]: answerText }));
    };

    const handleTFChange = (qId: number, idx: number, value: boolean) => {
        setAnswers(prev => {
            const current = prev[qId] || {};
            return { ...prev, [qId]: { ...current, [idx]: value } };
        });
    };

    const handleKQChange = (qId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const handleSubmit = () => {
        setSubmitted(true);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Đang tải đề luyện tập...</div>;
    if (questions.length === 0) return <div className="p-8 text-center text-slate-500">Chưa có đủ câu hỏi trong ngân hàng cho bài này.</div>;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Bài Tập Vận Dụng ({questions.length} câu)</h3>
            <div className="space-y-8">
                {questions.map((q, i) => (
                    <div key={q.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="font-semibold text-slate-700 mb-4 tracking-tight flex items-start gap-2">
                            <span className="shrink-0 bg-blue-100 text-blue-700 w-7 h-7 flex items-center justify-center rounded-full text-sm">{i + 1}</span>
                            <div className="mt-0.5"><MathRenderer content={q.content_latex_original || q.content_latex} hideToolbar /></div>
                        </div>

                        {q.type_code === 'TN' && (
                            <div className="pl-9 space-y-2">
                                {/* Note: Real parsing of choices is complex without parser.ts, but we just let students see the question latex which usually has choices rendered. Oh wait! If choices are in latex, we don't have separate a/b/c/d variables unless parsed. */}
                                {/* So we just provide 4 radio buttons: A, B, C, D */}
                                <div className="flex gap-4">
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                        <label key={opt} className={`flex items-center gap-2 p-2 px-4 rounded-lg border cursor-pointer border-slate-200 hover:bg-slate-50 ${answers[q.id] === opt ? 'bg-blue-50 border-blue-300' : ''}`}>
                                            <input type="radio" className="hidden" name={`q_${q.id}`} checked={answers[q.id] === opt} onChange={() => handleTNChange(q.id, opt)} disabled={submitted} />
                                            <span className={`w-5 h-5 flex items-center justify-center rounded-full border ${answers[q.id] === opt ? 'border-none bg-blue-500 text-white font-bold text-xs' : 'border-slate-300 text-slate-500 text-xs'}`}>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {q.type_code === 'TF' && (
                            <div className="pl-9 space-y-3">
                                {/* TF usually has 4 items in the latex (a, b, c, d). We provide 4 rows of Đ/S. */}
                                {['a', 'b', 'c', 'd'].map((item, idx) => (
                                    <div key={item} className="flex items-center gap-4">
                                        <span className="font-medium text-slate-600 w-6">{item})</span>
                                        <label className={`flex items-center gap-2 px-3 py-1 rounded border cursor-pointer ${answers[q.id]?.[idx] === true ? 'bg-green-50 border-green-300 text-green-700 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                            <input type="radio" className="hidden" name={`q_${q.id}_${idx}`} checked={answers[q.id]?.[idx] === true} onChange={() => handleTFChange(q.id, idx, true)} disabled={submitted} />
                                            Đúng
                                        </label>
                                        <label className={`flex items-center gap-2 px-3 py-1 rounded border cursor-pointer ${answers[q.id]?.[idx] === false ? 'bg-red-50 border-red-300 text-red-700 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                            <input type="radio" className="hidden" name={`q_${q.id}_${idx}`} checked={answers[q.id]?.[idx] === false} onChange={() => handleTFChange(q.id, idx, false)} disabled={submitted} />
                                            Sai
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(q.type_code === 'KQ' || q.type_code === 'TL') && (
                            <div className="pl-9">
                                <input 
                                    type="text" 
                                    className="w-full md:w-1/2 border border-slate-300 rounded-xl px-4 py-2 outline-none focus:border-blue-500 disabled:bg-slate-100" 
                                    placeholder="Nhập câu trả lời..." 
                                    value={answers[q.id] || ''} 
                                    onChange={e => handleKQChange(q.id, e.target.value)} 
                                    disabled={submitted}
                                />
                            </div>
                        )}

                        {submitted && (
                            <div className="pl-9 mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="text-sm font-bold text-green-800 mb-2">Đáp án:</div>
                                {/* Ideally we parse correct answer, but for now we just show the whole latex as it often includes \loigiai */}
                                <div className="text-green-900 text-sm overflow-auto max-h-64"><MathRenderer content={q.content_latex_original || q.content_latex} hideToolbar /></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!submitted && questions.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button onClick={handleSubmit} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                        Nộp Bài
                    </button>
                </div>
            )}
        </div>
    );
};
