
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiService } from '../services/api';
import { useAuthStore } from '../services/authStore';
import { parseMetadataFile } from '../services/parser';
import { extractTextFromDocx } from '../services/docxService';
import { extractTextFromPdf } from '../services/pdfService';
import { ID6Metadata, Chapter, Unit } from '../types';
import { normalizeID } from '../utils/id6Helper';
import { 
    Database, Edit3, Trash2, Save, X, Search, Loader2, 
    ChevronRight, ChevronDown, FolderOpen, Layers, PenTool, UploadCloud, AlertCircle, Check, WifiOff, CheckCircle2
} from 'lucide-react';
import { useLanguageStore } from '../services/languageStore';

export const MetadataManager: React.FC = () => {
    const { t } = useLanguageStore();
    const { user } = useAuthStore();
    
    // Data Store
    const [metadata, setMetadata] = useState<ID6Metadata[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter State - DEFAULT TO ALL
    const [selectedGrade, setSelectedGrade] = useState<number | 'ALL'>('ALL'); 
    const [selectedSubject, setSelectedSubject] = useState<string | 'ALL'>('ALL');
    const [selectedLevel, setSelectedLevel] = useState<string | 'ALL'>('ALL');
    
    // Tree Filter State
    const [filterNode, setFilterNode] = useState<{ type: 'ALL' | 'CHAP' | 'UNIT' | 'META', id: string | number | null }>({ type: 'ALL', id: null });
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;
    const [viewMode, setViewMode] = useState<'LIST' | 'IMPORT' | 'MANUAL'>('LIST');

    // Import State
    const [importText, setImportText] = useState('');
    const [previewData, setPreviewData] = useState<{ chapters: any[], units: any[], metadata: ID6Metadata[] } | null>(null);
    const [isSavingImport, setIsSavingImport] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Manual Entry State
    const [manualForm, setManualForm] = useState({
        cls: 2, sub: 'D', chap: 1, unit: 1, lvl: 'H', count: 1, desc: '',
        chapName: '', unitName: ''
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDesc, setEditDesc] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [m, c, u] = await Promise.all([
                apiService.fetchMetadata(),
                apiService.fetchChapters(),
                apiService.fetchUnits()
            ]);
            
            const processed = (m || []).map((item: ID6Metadata) => {
                let id_class = item.id_class !== undefined ? Number(item.id_class) : undefined;
                let id_subject = item.id_subject;
                let id_chapter = item.id_chapter !== undefined ? Number(item.id_chapter) : undefined;
                let id_unit = item.id_unit !== undefined ? Number(item.id_unit) : undefined;
                let id_count = item.id_count !== undefined ? Number(item.id_count) : undefined;

                const regex = /\[?\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*[-_]\s*(\d+)\s*\]?/i;
                const match = item.id_full?.match(regex);
                if (match) {
                    let rawClass = parseInt(match[1]);
                    if (rawClass === 10) rawClass = 0;
                    else if (rawClass === 11) rawClass = 1;
                    else if (rawClass === 12) rawClass = 2;
                    
                    id_class = rawClass;
                    id_subject = match[2].toUpperCase();
                    id_chapter = parseInt(match[3]);
                    id_unit = parseInt(match[5]);
                    id_count = parseInt(match[6]);
                } else if (id_class !== undefined) {
                    if (id_class === 10) id_class = 0;
                    else if (id_class === 11) id_class = 1;
                    else if (id_class === 12) id_class = 2;
                }

                return {
                    ...item,
                    id_full: normalizeID(item.id_full),
                    id_class,
                    id_subject,
                    id_chapter,
                    id_unit,
                    id_count
                };
            });

            setMetadata(processed);
            setChapters((c || []).map((chap: Chapter) => ({
                ...chap,
                id_class: chap.id_class === 10 ? 0 : chap.id_class === 11 ? 1 : chap.id_class === 12 ? 2 : chap.id_class,
                id_subject: chap.id_subject?.toUpperCase()
            })));
            setUnits(u || []);
        } catch (e: unknown) {
            console.error("Fetch Error:", e);
            setError(e instanceof Error ? e.message : "Lỗi kết nối Server.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPreviewData(null);
        setImportText('');
        setIsProcessingFile(true);

        try {
            let text = '';
            if (file.name.toLowerCase().endsWith('.docx')) text = await extractTextFromDocx(file);
            else if (file.name.toLowerCase().endsWith('.pdf')) text = await extractTextFromPdf(file);
            else text = await file.text();

            let cleanText = text.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-').replace(/[\u2022]/g, '-').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            cleanText = cleanText.replace(/([^\n])(\s*[-]{1,}\s*\[)/g, '$1\n$2').replace(/\n\s*[-]/g, '\n-');

            setImportText(cleanText);
            const result = parseMetadataFile(cleanText);
            setPreviewData(result);
        } catch (err: unknown) { 
            alert("Lỗi đọc file: " + (err instanceof Error ? err.message : String(err))); 
        } 
        finally { setIsProcessingFile(false); e.target.value = ''; }
    };

    const handleConfirmImport = async () => {
        if (!previewData) return;
        setIsSavingImport(true);
        try {
            const res = await apiService.importMetadata(previewData);
            if (res.success) {
                alert(`Đã nhập thành công ${res.count} định nghĩa ID6!`);
                setViewMode('LIST');
                setImportText('');
                setPreviewData(null);
                fetchData();
            }
        } catch (err: unknown) { 
            alert("Lỗi nhập: " + (err instanceof Error ? err.message : String(err))); 
        } finally { setIsSavingImport(false); }
    };
    
    const handleManualAdd = async () => {
        if (!manualForm.desc.trim()) return alert("Vui lòng nhập mô tả dạng toán!");
        try {
            const levels = ['N', 'H', 'V', 'C'];
            
            // Check existence
            let anyExists = false;
            for (const lvl of levels) {
                const id_full = `${manualForm.cls}${manualForm.sub}${manualForm.chap}${lvl}${manualForm.unit}-${manualForm.count}`;
                if (metadata.some(m => m.id_full === id_full)) anyExists = true;
            }

            if (anyExists) {
                if(!confirm(`Một số ID mức độ đã tồn tại. Ghi đè?`)) return;
            }

            const promises = levels.map(lvl => {
                const id_full = `${manualForm.cls}${manualForm.sub}${manualForm.chap}${lvl}${manualForm.unit}-${manualForm.count}`;
                const payload: ID6Metadata = {
                    id: 0, 
                    id_full, 
                    description: manualForm.desc,
                    grade_id: 0, subject_id: 0, chapter_id: 0, unit_id: 0, level_id: 0, 
                    count_id: manualForm.count,
                    id_class: manualForm.cls,
                    id_subject: manualForm.sub,
                    id_chapter: manualForm.chap,
                    id_unit: manualForm.unit,
                    id_level: lvl,
                    chapter_name: manualForm.chapName,
                    unit_name: manualForm.unitName
                };
                return apiService.addMetadata(payload);
            });

            await Promise.all(promises);
            alert("Thêm thành công! Đã tự động tạo đủ 4 mức độ (N, H, V, C).");
            setManualForm(prev => ({ ...prev, count: prev.count + 1, desc: '' })); 
            fetchData();
        } catch (err: unknown) { 
            alert("Lỗi: " + (err instanceof Error ? err.message : String(err))); 
        }
    };

    const handleGroupUpdate = async (group: any) => {
        try {
            await Promise.all(group.grouped_ids.map((id: string) => apiService.updateMetadata(id, editDesc)));
            setMetadata(prev => prev.map(item => group.grouped_ids.includes(item.id_full) ? { ...item, description: editDesc } : item));
            setEditingId(null);
        } catch (err: unknown) { 
            alert("Lỗi cập nhật: " + (err instanceof Error ? err.message : String(err))); 
        }
    };

    const handleGroupDelete = async (group: any) => {
        if (!confirm("Xoá TẤT CẢ các mức độ của dạng toán này?")) return;
        try {
            await Promise.all(group.grouped_ids.map((id: string) => apiService.deleteMetadata(id)));
            setMetadata(prev => prev.filter(item => !group.grouped_ids.includes(item.id_full)));
        } catch { alert("Lỗi xoá"); }
    };

    const handleBulkDelete = async () => {
        if (filteredMetadata.length === 0) return;
        if (!confirm(`Bạn có chắc chắn muốn xoá TẤT CẢ ${filteredMetadata.length} định nghĩa đang được lọc?`)) return;
        
        try {
            const ids = filteredMetadata.flatMap(m => m.grouped_pks).filter(id => id !== undefined) as number[];
            if (ids.length === 0) return;
            
            const res = await apiService.bulkDeleteMetadata(ids, user?.id);
            if (res.success) {
                alert(`Đã xoá thành công ${ids.length} định nghĩa!`);
                setMetadata(prev => prev.filter(m => !ids.includes(m.id as number)));
            }
        } catch (err) {
            console.error("Bulk Delete Error:", err);
            alert("Lỗi khi xoá hàng loạt.");
        }
    };

    const manualAvailableChapters = useMemo(() => {
        return chapters.filter(c => c.id_class == manualForm.cls && c.id_subject === manualForm.sub)
            .sort((a,b) => (a.id_chapter || 0) - (b.id_chapter || 0));
    }, [chapters, manualForm.cls, manualForm.sub]);

    const manualAvailableUnits = useMemo(() => {
        const chap = chapters.find(c => c.id_class == manualForm.cls && c.id_subject === manualForm.sub && c.id_chapter === manualForm.chap);
        if(!chap) return [];
        return units.filter(u => u.chapter_id === chap.id)
            .sort((a,b) => (a.id_unit || 0) - (b.id_unit || 0));
    }, [units, chapters, manualForm.cls, manualForm.sub, manualForm.chap]);

    const manualExistingTypes = useMemo(() => {
        const typesInUnit = metadata.filter(m => 
            m.id_class == manualForm.cls && 
            m.id_subject === manualForm.sub && 
            m.id_chapter === manualForm.chap && 
            m.id_unit === manualForm.unit
        );
        const map = new Map<number, string>();
        typesInUnit.forEach(m => {
            if (m.id_count && !map.has(m.id_count)) {
                map.set(m.id_count, m.description || '');
            }
        });
        return Array.from(map.entries()).map(([count, desc]) => ({ id_count: count, description: desc })).sort((a,b) => a.id_count - b.id_count);
    }, [metadata, manualForm.cls, manualForm.sub, manualForm.chap, manualForm.unit]);

    useEffect(() => {
        if(viewMode === 'MANUAL') {
            const maxCount = manualExistingTypes.length > 0 ? Math.max(...manualExistingTypes.map(m => m.id_count || 0)) : 0;
            setManualForm(prev => ({ ...prev, count: maxCount + 1 }));
        }
    }, [manualForm.cls, manualForm.sub, manualForm.chap, manualForm.unit, viewMode, manualExistingTypes]);

    // --- FILTER LOGIC ---
    const availableChapters = useMemo(() => {
        return chapters.filter(c => {
            if (selectedGrade !== 'ALL' && c.id_class != selectedGrade) return false;
            if (selectedSubject !== 'ALL' && c.id_subject !== selectedSubject) return false;
            return true;
        }).sort((a,b) => (a.id_chapter || 0) - (b.id_chapter || 0));
    }, [chapters, selectedGrade, selectedSubject]);

    const toggleExpand = (key: string) => {
        const newSet = new Set(expandedKeys);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setExpandedKeys(newSet);
    };

    const filteredMetadata = useMemo(() => {
        const filtered = metadata.filter(m => {
            if (selectedGrade !== 'ALL' && m.id_class != selectedGrade) return false;
            if (selectedSubject !== 'ALL' && m.id_subject !== selectedSubject) return false;
            if (selectedLevel !== 'ALL' && m.id_level !== selectedLevel) return false;
            
            if (filterNode.type === 'CHAP') {
                const selectedChapObj = chapters.find(c => c.id === filterNode.id);
                if (selectedChapObj) {
                    const targetChapNum = selectedChapObj.chapter_number ?? selectedChapObj.id_chapter;
                    if (m.id_chapter != targetChapNum) return false;
                    if (m.id_class != selectedChapObj.id_class) return false;
                    if (m.id_subject !== selectedChapObj.id_subject) return false;
                }
            }

            if (filterNode.type === 'UNIT') {
                const selectedUnitObj = units.find(u => u.id === filterNode.id);
                if (selectedUnitObj) {
                    const targetUnitNum = selectedUnitObj.unit_number ?? selectedUnitObj.id_unit;
                    if (m.id_unit != targetUnitNum) return false;
                    
                    const parentChap = chapters.find(c => c.id === selectedUnitObj.chapter_id);
                    if (parentChap) {
                        const targetChapNum = parentChap.chapter_number ?? parentChap.id_chapter;
                        if (m.id_chapter != targetChapNum) return false;
                        if (m.id_class != parentChap.id_class) return false;
                        if (m.id_subject !== parentChap.id_subject) return false;
                    }
                }
            }

            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                return m.id_full.toLowerCase().includes(lower) || 
                       (m.description || '').toLowerCase().includes(lower);
            }
            return true;
        });

        const map = new Map<string, any>();
        filtered.forEach(m => {
            const key = `${m.id_class}-${m.id_subject}-${m.id_chapter}-${m.id_unit}-${m.id_count}`;
            if (!map.has(key)) {
                map.set(key, { ...m, grouped_ids: [m.id_full], grouped_pks: [m.id], available_levels: [m.id_level || '?'] });
            } else {
                const existing = map.get(key)!;
                existing.grouped_ids.push(m.id_full);
                existing.grouped_pks.push(m.id);
                if (m.id_level && !existing.available_levels.includes(m.id_level)) {
                    existing.available_levels.push(m.id_level);
                }
            }
        });

        return Array.from(map.values()).sort((a, b) => {
            if ((a.id_chapter || 0) !== (b.id_chapter || 0)) return (a.id_chapter || 0) - (b.id_chapter || 0);
            if ((a.id_unit || 0) !== (b.id_unit || 0)) return (a.id_unit || 0) - (b.id_unit || 0);
            return (a.id_count || 0) - (b.id_count || 0);
        });
    }, [metadata, selectedGrade, selectedSubject, selectedLevel, filterNode, searchTerm, chapters, units]);

    const totalPages = Math.max(1, Math.ceil(filteredMetadata.length / pageSize));
    const pagedMetadata = useMemo(
        () => filteredMetadata.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [filteredMetadata, currentPage]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedGrade, selectedSubject, selectedLevel, filterNode, searchTerm]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const renderTabButton = (mode: 'LIST' | 'IMPORT' | 'MANUAL', icon: React.ElementType, label: string) => (
        <button onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${viewMode === mode ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>
            {React.createElement(icon, { size: 16 })} {label}
        </button>
    );

    return (
        <div className="h-full flex flex-col space-y-4 min-w-[1024px]">
            {/* Header Area */}
            <div className="flex justify-between items-center shrink-0 px-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Database size={24} className="text-indigo-600"/> {t('meta_title')}</h1>
                    <p className="text-xs text-slate-500 mt-0.5 ml-8">{t('meta_subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    {viewMode === 'LIST' && filteredMetadata.length > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                            <Trash2 size={16} />
                            Xoá {filteredMetadata.length} định nghĩa
                        </button>
                    )}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                        {renderTabButton('LIST', Layers, 'Danh sách')}
                        {renderTabButton('MANUAL', PenTool, 'Thủ công')}
                        {renderTabButton('IMPORT', UploadCloud, 'Nhập File')}
                    </div>
                </div>
            </div>

            {/* --- ERROR DISPLAY --- */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-800 animate-in fade-in">
                    <div className="p-2 bg-red-100 rounded-full"><WifiOff size={24}/></div>
                    <div>
                        <h3 className="font-bold text-sm">Lỗi tải dữ liệu</h3>
                        <p className="text-xs mt-1">{error}</p>
                        <p className="text-xs mt-1 italic">Hãy kiểm tra Backend đang chạy trên cổng 3001 và MySQL (user: root, no pass) đang bật.</p>
                    </div>
                    <button onClick={fetchData} className="ml-auto px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">Thử lại</button>
                </div>
            )}

            {/* --- MANUAL MODE --- */}
            {viewMode === 'MANUAL' && (
                <div className="flex-1 flex items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 p-8 relative overflow-hidden">
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                Cấu hình Định danh
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Khối Lớp</label>
                                    <select value={manualForm.cls} onChange={e => setManualForm({...manualForm, cls: parseInt(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                                        <option value={6}>Lớp 6</option><option value={7}>Lớp 7</option><option value={8}>Lớp 8</option><option value={9}>Lớp 9</option>
                                        <option value={0}>Lớp 10</option><option value={1}>Lớp 11</option><option value={2}>Lớp 12</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Môn Học</label>
                                    <select value={manualForm.sub} onChange={e => setManualForm({...manualForm, sub: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                                        <option value="D">Đại số / Giải tích</option><option value="H">Hình học</option><option value="C">Chuyên đề</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Chương</label>
                                        <select onChange={e => {
                                            if (e.target.value) {
                                                const c = manualAvailableChapters.find(c => c.id_chapter === parseInt(e.target.value));
                                                if(c) setManualForm(prev => ({...prev, chap: c.id_chapter||0, chapName: c.name || c.chapter_name || ''}));
                                            }
                                        }} className="text-xs border p-1 rounded bg-slate-50 outline-none text-slate-600 font-bold focus:ring-1">
                                            <option value="">-- Chọn Chương có sẵn --</option>
                                            {manualAvailableChapters.map(c => <option key={c.id_chapter} value={c.id_chapter}>Chương {c.id_chapter}. {c.name || c.chapter_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="number" min="0" value={manualForm.chap} onChange={e => setManualForm({...manualForm, chap: parseInt(e.target.value)})} className="w-20 p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-center" title="Số Chương"/>
                                        <input type="text" value={manualForm.chapName} onChange={e => setManualForm({...manualForm, chapName: e.target.value})} className="flex-1 p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tên Chương (Tạo mới/Cập nhật)"/>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Bài</label>
                                        <select onChange={e => {
                                            if (e.target.value) {
                                                const u = manualAvailableUnits.find(u => u.id_unit === parseInt(e.target.value));
                                                if(u) setManualForm(prev => ({...prev, unit: u.id_unit||0, unitName: u.name || u.unit_name || ''}));
                                            }
                                        }} className="text-xs border p-1 rounded bg-slate-50 outline-none text-slate-600 font-bold focus:ring-1">
                                            <option value="">-- Chọn Bài có sẵn --</option>
                                            {manualAvailableUnits.map(u => <option key={u.id_unit} value={u.id_unit}>Bài {u.id_unit}. {u.name || u.unit_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="number" min="0" value={manualForm.unit} onChange={e => setManualForm({...manualForm, unit: parseInt(e.target.value)})} className="w-20 p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-center" title="Số Bài"/>
                                        <input type="text" value={manualForm.unitName} onChange={e => setManualForm({...manualForm, unitName: e.target.value})} className="flex-1 p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Tên Bài (Tạo mới/Cập nhật)"/>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Mức độ</label>
                                    <div className="bg-slate-100 p-2 rounded-xl text-center text-xs font-bold text-indigo-600 flex items-center justify-center h-[42px] px-2 shadow-inner">
                                        Tự động tạo đủ 4 mức độ (N, H, V, C)
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Thứ tự Dạng</label>
                                    <input type="number" min="1" value={manualForm.count} onChange={e => setManualForm({...manualForm, count: parseInt(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-center h-[42px]"/>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-between space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                                    <span className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                    Mô tả & Preview
                                </h2>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mã ID</label>
                                        <div className="bg-slate-800 text-white p-4 justify-center items-center h-[90px] flex rounded-2xl shadow-inner text-center">
                                            <div className="text-xl lg:text-2xl font-mono font-black tracking-wider">[{manualForm.cls}{manualForm.sub}{manualForm.chap}<span className="text-indigo-400">X</span>{manualForm.unit}-{manualForm.count}]</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tên Dạng Toán</label>
                                        <textarea value={manualForm.desc} onChange={e => setManualForm({...manualForm, desc: e.target.value})} className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none h-[90px] resize-none shadow-inner bg-slate-50" placeholder="Mô tả nội dung dạng..."/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Dạng có sẵn ({manualExistingTypes.length})</label>
                                    <div className="max-h-36 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl bg-slate-50 divide-y divide-slate-100">
                                        {manualExistingTypes.length > 0 ? manualExistingTypes.map(m => (
                                            <div key={m.id_count} className="p-2.5 text-xs flex gap-3 hover:bg-white transition-colors">
                                                <span className="font-mono text-indigo-600 font-bold w-12 flex-shrink-0">Dạng {m.id_count}</span>
                                                <span className="text-slate-700">{m.description}</span>
                                            </div>
                                        )) : <div className="p-4 text-center text-slate-400 text-xs italic">Chưa có dạng nào ở bài này</div>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleManualAdd} className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex justify-center items-center gap-2 text-lg">
                                <Save size={20}/> Lưu vào Hệ Thống
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- IMPORT MODE --- */}
            {viewMode === 'IMPORT' && (
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-5/12 border-r border-slate-200 bg-slate-50 p-6 flex flex-col gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><UploadCloud className="text-emerald-600"/> Tải File Nguồn</h3>
                            <p className="text-xs text-slate-500 mt-1">Hỗ trợ .DOCX, .PDF, .TXT chứa cấu trúc cây thư mục. Hệ thống sẽ tự động tạo Chương/Bài nếu chưa có.</p>
                        </div>

                        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {isProcessingFile ? <Loader2 className="animate-spin" size={32}/> : <FolderOpen size={32}/>}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".docx,.pdf,.txt" onChange={handleFileUpload} />
                            <p className="font-bold text-slate-700">{isProcessingFile ? "Đang xử lý file..." : "Nhấn để chọn file"}</p>
                            <p className="text-xs text-slate-400 mt-1">hoặc kéo thả file vào đây</p>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2">Nội dung thô (Editable)</label>
                            <textarea 
                                className="flex-1 w-full border border-slate-200 rounded-xl p-4 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-white shadow-inner leading-relaxed"
                                placeholder={`-[0] Lớp 10\n----[D] Đại số\n-------[1] Mệnh đề tập hợp\n----------[1] Mệnh đề\n-------------[1] Nhận biết mệnh đề`}
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col gap-4 bg-white">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><CheckCircle2 className="text-emerald-600"/> Kết quả phân tích</h3>
                                {previewData && (
                                    <div className="flex gap-3 mt-2">
                                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">{previewData.chapters.length} Chương</span>
                                        <span className="text-xs font-bold bg-orange-50 text-orange-700 px-2 py-1 rounded-md border border-orange-100">{previewData.units.length} Bài</span>
                                        <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-100">{previewData.metadata.length} Dạng Toán</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={handleConfirmImport} disabled={!previewData || previewData.metadata.length === 0 || isSavingImport} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95">
                                {isSavingImport ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Lưu vào CSDL
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar border border-slate-100 rounded-xl">
                            {previewData && previewData.metadata.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">ID Code</th>
                                            <th className="p-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">Mô tả</th>
                                            <th className="p-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">Context (Auto-Create)</th>
                                            <th className="p-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 w-20 text-center">Valid</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {previewData.metadata.map((m: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 group">
                                                <td className="p-3 font-mono text-sm font-bold text-indigo-600 bg-white group-hover:bg-slate-50">{m.id_full}</td>
                                                <td className="p-3 text-sm text-slate-700">{m.description}</td>
                                                <td className="p-3 text-xs text-slate-500">
                                                    {m.chapter_name ? <div>C: {m.chapter_name}</div> : null}
                                                    {m.unit_name ? <div>U: {m.unit_name}</div> : null}
                                                </td>
                                                <td className="p-3 text-center"><Check size={16} className="text-emerald-500 mx-auto"/></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                    {isProcessingFile ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 size={48} className="animate-spin text-emerald-500 mb-2"/>
                                            <p className="text-slate-500 font-bold">Đang phân tích file...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <AlertCircle size={48} className="opacity-20"/>
                                            <p className="font-medium">Chưa có dữ liệu. Vui lòng tải file.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- LIST MODE --- */}
            {viewMode === 'LIST' && (
                <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
                    {/* Sidebar Filter */}
                    <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50/50">Bộ lọc dữ liệu</div>
                        <div className="p-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Khối Lớp</label>
                                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg">
                                    <button onClick={() => { setSelectedGrade('ALL'); setFilterNode({type:'ALL',id:null}); }} className={`col-span-4 py-1.5 rounded-md text-xs font-bold transition-all ${selectedGrade === 'ALL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Tất cả</button>
                                    {[6,7,8,9,0,1,2].map(g => (
                                        <button key={g} onClick={() => { setSelectedGrade(g); setFilterNode({type:'ALL',id:null}); }} className={`py-1.5 rounded-md text-xs font-bold transition-all ${selectedGrade === g ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{g === 0 ? '10' : g === 1 ? '11' : g === 2 ? '12' : g}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Môn Học</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                                    <button onClick={() => { setSelectedSubject('ALL'); setFilterNode({type:'ALL',id:null}); }} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${selectedSubject === 'ALL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Tất cả</button>
                                    {['D', 'H', 'C'].map(s => (
                                        <button key={s} onClick={() => { setSelectedSubject(s); setFilterNode({type:'ALL',id:null}); }} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${selectedSubject === s ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{s === 'D' ? 'Đại số' : s === 'H' ? 'Hình học' : 'Chuyên đề'}</button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Mức độ</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                                    <button onClick={() => setSelectedLevel('ALL')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${selectedLevel === 'ALL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Tất cả</button>
                                    {['N', 'H', 'V', 'C'].map(lvl => (
                                        <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${selectedLevel === lvl ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{lvl}</button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block flex justify-between">
                                    Cây Thư Mục
                                    <button onClick={() => setFilterNode({type: 'ALL', id: null})} className="text-indigo-600 hover:underline cursor-pointer">Xem tất cả</button>
                                </label>
                                <div className="space-y-1">
                                    {availableChapters.length === 0 ? (
                                        <div className="text-xs text-slate-400 italic p-2 text-center border border-dashed border-slate-200 rounded-lg">Chọn khối lớp để xem chương trình.</div>
                                    ) : (
                                        availableChapters.map(c => {
                                            const cKey = `C-${c.id}`;
                                            const isExpanded = expandedKeys.has(cKey);
                                            const chapUnits = units.filter(u => u.chapter_id === c.id).sort((a,b) => (a.id_unit||0)-(b.id_unit||0));
                                            const isActive = filterNode.type === 'CHAP' && filterNode.id === c.id;
                                            return (
                                                <div key={c.id}>
                                                    <button onClick={() => { toggleExpand(cKey); setFilterNode({type:'CHAP', id:c.id}); }} className={`w-full text-left py-2 px-2 text-xs font-bold flex items-center hover:bg-slate-50 rounded transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}>
                                                        {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Chương {c.chapter_number ?? c.id_chapter}. {c.name || c.chapter_name}
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="ml-4 border-l border-slate-200 pl-2 space-y-1 mt-1">
                                                            {chapUnits.map(u => (
                                                                <button key={u.id} onClick={() => setFilterNode({type:'UNIT', id:u.id})} className={`w-full text-left py-1.5 px-2 rounded text-[11px] hover:text-indigo-600 truncate block transition-colors ${filterNode.id === u.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                                                                    Bài {u.unit_number || u.id_unit}. {u.name || u.unit_name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-400 transition-all bg-slate-50 focus:bg-white" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">{filteredMetadata.length} bản ghi</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 border-b w-32">ID Code</th>
                                        <th className="p-4 border-b w-48">Vị trí</th>
                                        <th className="p-4 border-b">Mô tả Dạng toán</th>
                                        <th className="p-4 border-b w-24 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Đang tải dữ liệu...</td></tr>
                                    ) : filteredMetadata.length === 0 ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Không có dữ liệu phù hợp</td></tr>
                                    ) : 
                                    pagedMetadata.map(m => (
                                        <tr key={m.id_full} className="hover:bg-slate-50 group">
                                            <td className="p-4 align-top">
                                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs shadow-sm">
                                                    {m.id_class}{m.id_subject}{m.id_chapter}[{m.available_levels?.join('')}]{m.id_unit}-{m.id_count}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top text-xs text-slate-500">
                                                <div className="font-bold text-slate-700">Chương {m.id_chapter} {m.chapter_name ? `. ${m.chapter_name}` : ''}</div>
                                                <div className="truncate w-40" title={`Bài ${m.id_unit}${m.unit_name ? ': ' + m.unit_name : ''}`}>Bài {m.id_unit}{m.unit_name ? `. ${m.unit_name}` : ''}</div>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {m.available_levels?.map((lvl: string) => (
                                                        <div key={lvl} className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${lvl === 'N' ? 'bg-green-100 text-green-700' : lvl === 'H' ? 'bg-blue-100 text-blue-700' : lvl === 'V' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{lvl}</div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                {editingId === m.id_full ? (
                                                    <div className="flex gap-2">
                                                        <textarea autoFocus className="flex-1 border p-2 rounded text-sm w-full outline-none focus:ring-2 focus:ring-indigo-100" value={editDesc} onChange={e => setEditDesc(e.target.value)}/>
                                                        <div className="flex flex-col gap-1">
                                                            <button onClick={() => handleGroupUpdate(m)} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"><Check size={16}/></button>
                                                            <button onClick={() => setEditingId(null)} className="p-2 bg-slate-50 text-slate-400 rounded hover:bg-slate-100"><X size={16}/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => { setEditingId(m.id_full); setEditDesc(m.description); }}>
                                                        {m.description || <em className="text-slate-300 italic">Chưa có mô tả</em>}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingId(m.id_full); setEditDesc(m.description); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit3 size={16}/></button>
                                                    <button onClick={() => handleGroupDelete(m)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredMetadata.length > pageSize && (
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                                <span className="text-xs font-medium text-slate-500">
                                    Trang {currentPage}/{totalPages} · {filteredMetadata.length} bản ghi
                                </span>
                                <div className="flex gap-2">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(page => page - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40">Trước</button>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(page => page + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40">Sau</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
