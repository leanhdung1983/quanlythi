
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
    BarChart3, AlertTriangle, CheckCircle2, 
    Target, Brain, ShieldCheck, Loader2
} from 'lucide-react';

interface IRTData {
    id: number;
    legacy_full_id: string;
    level_code: string;
    total_attempts: number;
    error_rate: number;
    warning?: string;
}

export const IRTAnalysis: React.FC = () => {
    const [data, setData] = useState<IRTData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    useEffect(() => {
        loadAnalysis();
    }, []);

    const loadAnalysis = async () => {
        setLoading(true);
        try {
            const res = await apiService.fetchIRTAnalysis();
            if (res.success) {
                setData(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    const visibleData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="h-full flex flex-col space-y-5 min-w-0">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Target className="text-indigo-500"/> Phân tích Độ khó Thực tế (IRT)
                    </h1>
                    <p className="text-xs text-slate-500">Đối chiếu độ khó chủ quan (ID6) với dữ liệu làm bài thực tế của học sinh.</p>
                </div>
                <button 
                    onClick={loadAnalysis}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2"
                >
                    <BarChart3 size={16}/> Cập nhật dữ liệu
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Brain size={20}/></div>
                        <span className="text-sm font-bold text-slate-600">Tổng số câu đã thi</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800">{data.filter(d => d.total_attempts > 0).length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><AlertTriangle size={20}/></div>
                        <span className="text-sm font-bold text-slate-600">Cảnh báo sai lệch</span>
                    </div>
                    <p className="text-2xl font-black text-amber-600">{data.filter(d => d.warning).length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><ShieldCheck size={20}/></div>
                        <span className="text-sm font-bold text-slate-600">Độ tin cậy hệ thống</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">85%</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-slate-100">Câu hỏi (ID6)</th>
                                <th className="p-4 border-b border-slate-100">Độ khó ID6</th>
                                <th className="p-4 border-b border-slate-100">Lượt thi</th>
                                <th className="p-4 border-b border-slate-100">Tỷ lệ sai</th>
                                <th className="p-4 border-b border-slate-100">Phân tích & Cảnh báo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                            <p className="text-slate-500 font-medium">Đang tính toán ma trận IRT...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-slate-400">Chưa có dữ liệu thi cử để phân tích.</td>
                                </tr>
                            ) : visibleData.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-mono font-bold text-slate-700 mb-1">{item.legacy_full_id}</div>
                                        <div className="text-[10px] text-slate-400">ID: #{item.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                            item.level_code === 'N' ? 'bg-green-100 text-green-700' :
                                            item.level_code === 'H' ? 'bg-blue-100 text-blue-700' :
                                            item.level_code === 'V' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {item.level_code === 'N' ? 'Nhận biết' :
                                             item.level_code === 'H' ? 'Thông hiểu' :
                                             item.level_code === 'V' ? 'Vận dụng' : 'Vận dụng cao'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-600">{item.total_attempts}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                                <div 
                                                    className={`h-full transition-all ${item.error_rate > 0.5 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${item.error_rate * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{Number(item.error_rate * 100 || 0).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {item.warning ? (
                                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 animate-pulse">
                                                <AlertTriangle size={14}/>
                                                <span className="text-xs font-bold">{item.warning}</span>
                                            </div>
                                        ) : item.total_attempts > 0 ? (
                                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                                <CheckCircle2 size={14}/>
                                                <span className="text-xs font-bold">Độ khó khớp thực tế</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Chưa đủ dữ liệu</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && data.length > pageSize && (
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                        <span className="text-xs font-medium text-slate-500">Trang {currentPage}/{totalPages} · {data.length.toLocaleString('vi-VN')} câu</span>
                        <div className="flex gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(page => page - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40">Trước</button>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(page => page + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40">Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
