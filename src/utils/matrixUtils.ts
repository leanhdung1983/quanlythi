import { SavedMatrix } from '../types';

export const extractMatrixHierarchy = (m: SavedMatrix, t?: any, treeData?: any[]) => {
    let grade = 'OT';
    let subject = 'Khác';
    let chapter = 'Chung';
    let lesson = 'Chung';

    try {
        const fullData = typeof m.matrix_data === 'string' ? JSON.parse(m.matrix_data) : m.matrix_data;
        
        if (fullData.settings?.grade_id !== undefined) {
            grade = String(fullData.settings.grade_id);
        }

        const data = fullData.matrix || fullData;
        
        let foundGrade = grade !== 'OT' ? grade : null;
        let foundSubject = null;
        
        const chapters = new Set<string>();
        const lessons = new Set<string>();
        let firstParts: string[] | null = null;
        
        for (const type of ['TN', 'TF', 'KQ', 'TL']) {
            const section = data[type];
            if (section) {
                for (const key of Object.keys(section)) {
                    const parts = key.split('-');
                    if (parts.length >= 4) {
                        if (!foundGrade) foundGrade = parts[0];
                        if (!foundSubject) foundSubject = parts[1];
                        if (!firstParts) firstParts = parts;
                        chapters.add(`${parts[0]}-${parts[1]}-${parts[2]}`);
                        lessons.add(`${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`);
                    }
                }
            }
        }
        
        if (firstParts) {
            grade = foundGrade || firstParts[0];
            subject = foundSubject || firstParts[1];
            subject = subject === 'D' ? (t ? t('sub_alg') : 'Đại số') : (subject === 'H' ? (t ? t('sub_geo') : 'Hình học') : subject);
            
            if (chapters.size > 1 || lessons.size > 1) {
                chapter = 'Ôn tập';
                lesson = 'Ôn tập';
            } else {
                const parts = firstParts;
                let chapterNameStr = `Chương ${parts[2]}`;
                let unitNameStr = `Bài ${parts[3]}`;
                
                if (treeData && treeData.length > 0) {
                    const gNode = treeData.find(g => g.grade === Number(parts[0]));
                    if (gNode) {
                        const sNode = gNode.subjects.find(s => s.subject === parts[1]);
                        if (sNode) {
                            const cNode = sNode.chapters.find(c => c.num === Number(parts[2]));
                            if (cNode) {
                                chapterNameStr = `Chương ${cNode.num}. ${cNode.name}`;
                                const uNode = cNode.units.find(u => u.num === Number(parts[3]));
                                if (uNode) {
                                    unitNameStr = `Bài ${uNode.num}. ${uNode.name}`;
                                }
                            }
                        }
                    }
                }
                chapter = chapterNameStr;
                lesson = unitNameStr;
            }
        }
    } catch {}
    
    return { grade, subject, chapter, lesson };
};

export const prepareMatrixPayload = (matrixDataRaw: any) => {
    const payload: any = {};
    const types = ['TN', 'TF', 'KQ', 'TL'];
    const matrixData = matrixDataRaw?.matrix || matrixDataRaw || {};
    
    types.forEach(type => {
        payload[type] = [];
        const rawData = matrixData[type];
        if (Array.isArray(rawData)) {
            payload[type] = rawData;
        } else if (rawData && typeof rawData === 'object') {
            const items = Object.entries(rawData).map(([key, levels]) => {
                const parts = key.split('-');
                if (parts.length < 5) return null;
                return { cls: parseInt(parts[0]), sub: parts[1], chap: parseInt(parts[2]), unit: parseInt(parts[3]), count: parseInt(parts[4]), levels: levels };
            }).filter((item: any) => {
                if (!item || !item.levels) return false;
                const l = item.levels as Record<string, number>;
                return (l.N||0) + (l.H||0) + (l.V||0) + (l.C||0) > 0;
            });
            payload[type] = items;
        }
    });
    return payload;
};
