
export const normalizeLevel = (rawLevel: string): string => {
    const level = rawLevel.toUpperCase();
    return ({ Y: 'N', B: 'H', K: 'V', G: 'C', T: 'C' } as Record<string, string>)[level] || level;
};

export const normalizeID = (id: string): string => {
    if (!id) return '';
    // Extract parts: [Class][Subject][Chapter][Level][Unit]-[Count]
    const regex = /\[?\s*(10|11|12|[0126789])\s*([DHC])\s*(\d+)\s*([NHVCXYBKGT])\s*(\d+)\s*[-_]\s*(\d+)\s*\]?/i;
    const match = id.match(regex);
    if (match) {
        const cls = match[1] === '10' ? '0' : match[1] === '11' ? '1' : match[1] === '12' ? '2' : match[1];
        const sub = match[2].toUpperCase();
        const chap = match[3];
        const lvl = normalizeLevel(match[4]);
        const unit = match[5];
        const count = match[6];
        return `${cls}${sub}${chap}${lvl}${unit}-${count}`;
    }
    return id;
};

export const isValidID6 = (id: string): boolean => {
    if (!id) return false;
    const normalized = normalizeID(id);
    return /^[0126789][DHC]\d+[NHVC]\d+-\d+$/.test(normalized) && normalizeID(normalized) === normalized;
};

export const decodeID6 = (id: string | null | undefined, chapterName?: string, unitName?: string) => {
    if (!id) {
        return {
            valid: false,
            grade: 'Unknown',
            subject: 'Unknown',
            chapter: 'Unknown',
            chapterName: '',
            unit: 'Unknown',
            unitName: unitName || '',
            level: 'Unknown',
            levelCode: '',
            levelStyle: ''
        };
    }

    // Expected format: [Class][Subject][Chapter][Level][Unit]-[Count]
    const regex = /\[?(\d+)([A-Z]+)(\d+)([A-Z]+)(\d+)-(\d+)\]?/i;
    // Normalize first to handle Y, B, K, G before checking regex
    const normalizedId = normalizeID(id);
    const match = normalizedId.match(regex);

    if (!match) {
        return {
            valid: false,
            grade: 'Unknown',
            subject: 'Unknown',
            chapter: 'Unknown',
            chapterName: '',
            unit: 'Unknown',
            unitName: unitName || '',
            level: 'Unknown',
            levelCode: '',
            levelStyle: ''
        };
    }

    const rawClass = parseInt(match[1]);
    const rawSubject = match[2].toUpperCase();
    const rawChapter = parseInt(match[3]);
    const rawLevel = match[4].toUpperCase();
    const rawUnit = parseInt(match[5]);

    // Mapping
    const gradeMap: Record<number, string> = { 
        0: 'Lớp 10', 1: 'Lớp 11', 2: 'Lớp 12',
        6: 'Lớp 6', 7: 'Lớp 7', 8: 'Lớp 8', 9: 'Lớp 9',
        10: 'Lớp 10', 11: 'Lớp 11', 12: 'Lớp 12'
    };
    
    const subjectMap: Record<string, string> = { 'D': 'Đại số / Giải tích', 'H': 'Hình học', 'C': 'Chuyên đề' };
    const levelMap: Record<string, string> = { 
        'N': 'Nhận biết', 
        'H': 'Thông hiểu', 
        'V': 'Vận dụng', 
        'C': 'Vận dụng cao',
        'Y': 'Yếu (NB)',
        'B': 'Trung bình (TH)',
        'K': 'Khá (VD)',
        'G': 'Giỏi (VDC)',
        'T': 'Tốt (VDC)'
    };
    const levelColor: Record<string, string> = {
        'N': 'text-green-600 bg-green-50 border-green-200',
        'H': 'text-blue-600 bg-blue-50 border-blue-200',
        'V': 'text-yellow-600 bg-yellow-50 border-yellow-200',
        'C': 'text-red-600 bg-red-50 border-red-200',
        'Y': 'text-green-600 bg-green-50 border-green-200',
        'B': 'text-blue-600 bg-blue-50 border-blue-200',
        'K': 'text-yellow-600 bg-yellow-50 border-yellow-200',
        'G': 'text-red-600 bg-red-50 border-red-200',
        'T': 'text-red-600 bg-red-50 border-red-200',
    };

    return {
        valid: true,
        grade: gradeMap[rawClass] || `Lớp ${rawClass}`,
        subject: subjectMap[rawSubject] || rawSubject,
        chapter: `Chương ${rawChapter}`,
        chapterName: chapterName || '',
        unit: `Bài ${rawUnit}`,
        unitName: unitName || '',
        level: levelMap[rawLevel] || rawLevel,
        levelCode: rawLevel,
        levelStyle: levelColor[rawLevel] || 'text-slate-600 bg-slate-50'
    };
};
