
import React, { useState, useRef } from 'react';
import { convertDocToLatex } from '../services/aiService';
import { fileToBase64 } from '../utils/fileUtils';
import { 
    UploadCloud, CheckCircle2, Copy, AlertTriangle, Wand2, 
    Loader2, RefreshCw, FileText, Download
} from 'lucide-react';
import { FileType, UploadedFile } from '../types';
import { useLanguageStore } from '../services/languageStore';

export const Converter: React.FC = () => {
    const { t } = useLanguageStore();
    const [fileName, setFileName] = useState('');
    const [convertedText, setConvertedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [statusMsg, setStatusMsg] = useState('');
    const [warnings, setWarnings] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [expectedQuestionCount, setExpectedQuestionCount] = useState(0);
    const [missingQuestionNumbers, setMissingQuestionNumbers] = useState<number[]>([]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const lowerName = file.name.toLowerCase();
            
            setFileName(file.name);
            setIsProcessing(true);
            setErrorMsg(null);
            setConvertedText('');
            setWarnings([]);
            setIsComplete(false);
            setExpectedQuestionCount(0);
            setMissingQuestionNumbers([]);
            setStatusMsg("Đang tải file lên...");

            try {
                // Xác định loại file
                let type = FileType.UNKNOWN;
                if (lowerName.endsWith('.pdf')) type = FileType.PDF;
                else if (lowerName.endsWith('.docx')) type = FileType.DOCX;
                else throw new Error("Chỉ hỗ trợ file .PDF hoặc .DOCX");

                // Chuyển sang Base64
                const base64 = await fileToBase64(file);
                
                const uploadedFile: UploadedFile = {
                    name: file.name,
                    type: type,
                    base64Data: base64
                };

                // Gọi AI Service mới
                const result = await convertDocToLatex(
                    uploadedFile,
                    (msg) => setStatusMsg(msg)
                );
                
                setConvertedText(result.latex);
                setQuestionCount(result.questionCount);
                setExpectedQuestionCount(result.expectedQuestionCount);
                setMissingQuestionNumbers(result.missingQuestionNumbers);
                setWarnings(result.warnings);
                setIsComplete(result.complete);
            } catch (err: unknown) {
                const error = err as Error;
                console.error(error);
                setErrorMsg(error.message || "Lỗi xử lý. Vui lòng thử lại.");
            } finally {
                setIsProcessing(false);
                if (e.target) e.target.value = '';
            }
        }
    };

    const handleCopy = () => {
        if (!isComplete) return;
        navigator.clipboard.writeText(convertedText);
        alert("Đã sao chép vào bộ nhớ tạm!");
    };

    const handleDownload = () => {
        if (!isComplete || !convertedText) return;
        const url = URL.createObjectURL(new Blob([convertedText], { type: 'text/x-tex;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName.replace(/\.(pdf|docx)$/i, '') || 'ex_test'}.tex`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <div className="h-full flex flex-col space-y-4 min-h-[600px] min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shrink-0 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wand2 className="text-purple-600"/> {t('ai_converter')}
                    </h1>
                    <p className="text-xs text-slate-500">PDF được chuyển theo trang và đối chiếu đủ số câu trước khi xác nhận bản ex_test.</p>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                    Gemini key được quản lý an toàn trên máy chủ
                </span>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col items-center justify-center bg-slate-50/50">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".pdf,.docx" 
                        onChange={handleUpload} 
                    />
                    
                    {!isProcessing && !convertedText ? (
                        <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-2xl w-full max-w-2xl bg-white hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UploadCloud size={32}/>
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Tải lên tài liệu</h3>
                            <p className="text-slate-500 text-sm">Hỗ trợ PDF và DOCX (Word). AI sẽ tự động phân tích và chuyển sang LaTeX.</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-3xl">
                            {isProcessing ? (
                                <div className="text-center py-8">
                                    <Loader2 size={48} className="animate-spin text-purple-600 mx-auto mb-4"/>
                                    <h3 className="text-lg font-bold text-slate-700">{statusMsg}</h3>
                                    <p className="text-slate-400 text-sm mt-2">Quá trình này có thể mất vài phút tùy độ dài tài liệu.</p>
                                </div>
                            ) : (
                                <div className={`flex items-center justify-between gap-3 ${isComplete ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border rounded-xl p-4`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{isComplete ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}</div>
                                        <div>
                                            <h3 className={`font-bold ${isComplete ? 'text-green-800' : 'text-amber-800'}`}>{isComplete ? `Đủ ${questionCount}/${expectedQuestionCount || questionCount} câu hỏi` : `Chưa hoàn tất · ${questionCount}/${expectedQuestionCount || '?'} câu được tạo`}</h3>
                                            <p className={`text-sm ${isComplete ? 'text-green-600' : 'text-amber-700'}`}>{fileName} · Hãy đối chiếu mã nguồn với tài liệu gốc trước khi sử dụng.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setConvertedText(''); setFileName(''); setWarnings([]); setQuestionCount(0); setExpectedQuestionCount(0); setMissingQuestionNumbers([]); setIsComplete(false); }} className="p-2 text-slate-500 hover:bg-white rounded-lg transition-colors" title="Làm lại">
                                            <RefreshCw size={20}/>
                                        </button>
                                        <button onClick={handleDownload} disabled={!isComplete} className="bg-white text-indigo-700 border border-indigo-200 px-3 py-2 rounded-lg font-bold hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2" title={isComplete ? 'Tải mã nguồn ex_test' : 'Cần đủ câu trước khi tải'}>
                                            <Download size={18}/> <span className="hidden sm:inline">Tải .tex</span>
                                        </button>
                                        <button onClick={handleCopy} disabled={!isComplete} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm" title={isComplete ? 'Sao chép mã nguồn ex_test' : 'Cần đủ câu trước khi sao chép'}>
                                            <Copy size={18}/> Sao chép
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 max-w-2xl w-full">
                            <AlertTriangle size={24} className="shrink-0"/>
                            <p className="text-sm font-medium">{errorMsg}</p>
                        </div>
                    )}
                    {warnings.length > 0 && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-3xl w-full text-amber-800 text-sm">
                            <div className="font-bold flex items-center gap-2 mb-1"><AlertTriangle size={16}/> Cần kiểm tra đầu ra ex_test</div>
                            {warnings.map(warning => <p key={warning}>• {warning}</p>)}
                            {missingQuestionNumbers.length > 0 && <p className="font-semibold mt-2">Câu còn thiếu: {missingQuestionNumbers.join(', ')}</p>}
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-slate-900 p-0 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 right-0 bg-slate-800/80 backdrop-blur-sm p-2 flex justify-between items-center px-4 border-b border-white/10 z-10">
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-2"><FileText size={14}/> LaTeX Output</span>
                    </div>
                    <textarea 
                        className="flex-1 w-full h-full bg-transparent text-green-400 font-mono text-sm p-6 pt-12 resize-none outline-none custom-scrollbar leading-relaxed"
                        value={convertedText}
                        readOnly
                        placeholder="Kết quả LaTeX sẽ hiển thị ở đây..."
                    />
                </div>
            </div>
        </div>
    );
};
