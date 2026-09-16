
import { MatrixTreeNode } from '../types';
import { 
    Document, Packer, Paragraph, Table, TableRow, TableCell, 
    WidthType, BorderStyle, TextRun, AlignmentType, VerticalAlign, HeadingLevel 
} from 'docx';

interface LevelCounts {
    N: number;
    H: number;
    V: number;
    C: number;
}

interface MatrixRow {
    chapterName: string;
    unitName: string;
    TN: { N: number, H: number, V: number };
    TF: { N: number, H: number, V: number };
    KQ: { N: number, H: number, V: number };
    TL: { N: number, H: number, V: number };
    total: { N: number, H: number, V: number };
}

interface SpecRow {
    chapterName: string;
    unitName: string;
    description: string;
    competencies: string[];
    TN: { N: number, H: number, V: number, C: number };
    TF: { N: number, H: number, V: number, C: number };
    KQ: { N: number, H: number, V: number, C: number };
    TL: { N: number, H: number, V: number, C: number };
}

export const ensureMatrixObject = (input: any): { TN: Record<string, any>, TF: Record<string, any>, KQ: Record<string, any>, TL: Record<string, any> } => {
    if (!input) return { TN: {}, TF: {}, KQ: {}, TL: {} };
    let current = input;

    // Unpack if input is an object with matrix_data or matrix property
    if (typeof current === 'object' && current !== null) {
        if (current.matrix_data) {
            try {
                current = typeof current.matrix_data === 'string' ? JSON.parse(current.matrix_data) : current.matrix_data;
            } catch {}
        }
        if (current && current.matrix) {
            current = current.matrix;
        }
    }

    // Try parsing string JSON up to 3 levels deep
    for (let i = 0; i < 3; i++) {
        if (typeof current === 'string') {
            try { 
                current = JSON.parse(current); 
            } catch { 
                break; 
            }
        } else { 
            break; 
        }
    }

    // Re-check after string parsing
    if (current && typeof current === 'object') {
        if (current.matrix_data) {
            try {
                current = typeof current.matrix_data === 'string' ? JSON.parse(current.matrix_data) : current.matrix_data;
            } catch {}
        }
        if (current && current.matrix) {
            current = current.matrix;
        }
    }

    return {
        TN: (current && typeof current.TN === 'object' && !Array.isArray(current.TN)) ? current.TN : {},
        TF: (current && typeof current.TF === 'object' && !Array.isArray(current.TF)) ? current.TF : {},
        KQ: (current && typeof current.KQ === 'object' && !Array.isArray(current.KQ)) ? current.KQ : {},
        TL: (current && typeof current.TL === 'object' && !Array.isArray(current.TL)) ? current.TL : {}
    };
};

const parseKey = (key: string) => {
    if (!key) return null;
    const parts = key.split('-');
    if (parts.length < 4) return null;
    return {
        cls: Number(parts[0]),
        sub: parts[1],
        chap: Number(parts[2]),
        unit: Number(parts[3]),
        count: parts.length >= 5 ? Number(parts[4]) : 1
    };
};

const buildMetadataMap = (treeData: MatrixTreeNode[]) => {
    const map = new Map<string, { chapName: string, unitName: string, desc: string, competencies: string[] }>();
    if (!treeData || !Array.isArray(treeData)) return map;

    treeData.forEach(g => {
        const gradeVal = g.grade;
        const actualGrade = gradeVal === 0 ? 10 : gradeVal === 1 ? 11 : gradeVal === 2 ? 12 : gradeVal;

        g.subjects?.forEach(s => {
            s.chapters?.forEach(c => {
                const chapName = c.name ? (c.name.startsWith('Chương') ? c.name : `Chương ${c.num}. ${c.name}`) : `Chương ${c.num}`;

                c.units?.forEach(u => {
                    const unitName = u.name ? (u.name.startsWith('Bài') ? u.name : `Bài ${u.num}. ${u.name}`) : `Bài ${u.num}`;

                    u.types?.forEach(t => {
                        let compList: string[] = [];
                        if (Array.isArray(t.competencies)) {
                            compList = t.competencies;
                        } else if (typeof t.competencies === 'string') {
                            try {
                                const parsedComp = JSON.parse(t.competencies);
                                compList = Array.isArray(parsedComp) ? parsedComp : [t.competencies];
                            } catch {
                                compList = [t.competencies];
                            }
                        }

                        const desc = t.description || `Dạng toán ${t.count_id}`;
                        const metaObj = {
                            chapName,
                            unitName,
                            desc,
                            competencies: compList
                        };

                        // Store both grade indices: internal (0, 1, 2) and actual (10, 11, 12)
                        map.set(`${gradeVal}-${s.subject}-${c.num}-${u.num}-${t.count_id}`, metaObj);
                        map.set(`${actualGrade}-${s.subject}-${c.num}-${u.num}-${t.count_id}`, metaObj);

                        // Unit-level fallback
                        if (!map.has(`${gradeVal}-${s.subject}-${c.num}-${u.num}`)) {
                            map.set(`${gradeVal}-${s.subject}-${c.num}-${u.num}`, metaObj);
                            map.set(`${actualGrade}-${s.subject}-${c.num}-${u.num}`, metaObj);
                        }
                    });
                });
            });
        });
    });
    return map;
};

const aggregateData = (treeData: MatrixTreeNode[], matrixInput: any) => {
    const metaMap = buildMetadataMap(treeData);
    const rowMap = new Map<string, any>(); 
    const matrix = ensureMatrixObject(matrixInput);

    (['TN', 'TF', 'KQ', 'TL'] as const).forEach(typeKey => {
        const typeData = matrix[typeKey] || {};
        if (typeof typeData !== 'object') return;

        Object.entries(typeData).forEach(([key, val]) => {
            const counts = val as LevelCounts;
            const parsed = parseKey(key);
            if (!parsed) return;
            const total = (counts.N || 0) + (counts.H || 0) + (counts.V || 0) + (counts.C || 0);
            if (total === 0) return;

            const gradeName = parsed.cls === 0 || parsed.cls === 10 ? "Lớp 10" :
                              parsed.cls === 1 || parsed.cls === 11 ? "Lớp 11" :
                              parsed.cls === 2 || parsed.cls === 12 ? "Lớp 12" : `Lớp ${parsed.cls}`;
            const subName = parsed.sub === 'D' ? "Đại số & Giải tích" : parsed.sub === 'H' ? "Hình học" : "Chuyên đề";

            const unitFallbackKey = `${parsed.cls}-${parsed.sub}-${parsed.chap}-${parsed.unit}`;
            const metaFromMap = metaMap.get(key) || metaMap.get(unitFallbackKey);

            const fallbackMeta = { 
                chapName: `Chương ${parsed.chap} (${gradeName} - ${subName})`, 
                unitName: `Bài ${parsed.unit}`, 
                desc: `Dạng toán số ${parsed.count}`,
                competencies: [] as string[]
            };
            const meta = metaFromMap || fallbackMeta;
            const rowKey = `${parsed.cls}-${parsed.sub}-${parsed.chap}-${parsed.unit}`;
            
            if (!rowMap.has(rowKey)) {
                rowMap.set(rowKey, {
                    sortKey: rowKey,
                    chapterName: meta.chapName,
                    unitName: meta.unitName,
                    TN: { N:0, H:0, V:0 }, TF: { N:0, H:0, V:0 }, KQ: { N:0, H:0, V:0 }, TL: { N:0, H:0, V:0 },
                    total: { N:0, H:0, V:0 },
                    details: new Map<string, SpecRow>() 
                });
            }

            const row = rowMap.get(rowKey);
            row[typeKey].N += (counts.N || 0); 
            row[typeKey].H += (counts.H || 0); 
            row[typeKey].V += (counts.V || 0) + (counts.C || 0);

            row.total.N += (counts.N || 0); 
            row.total.H += (counts.H || 0); 
            row.total.V += (counts.V || 0) + (counts.C || 0);

            const detailKey = key;
            if (!row.details.has(detailKey)) {
                row.details.set(detailKey, {
                    chapterName: meta.chapName, 
                    unitName: meta.unitName, 
                    description: meta.desc,
                    competencies: meta.competencies,
                    TN: { N:0, H:0, V:0, C:0 }, 
                    TF: { N:0, H:0, V:0, C:0 }, 
                    KQ: { N:0, H:0, V:0, C:0 }, 
                    TL: { N:0, H:0, V:0, C:0 }
                });
            }
            const detail = row.details.get(detailKey);
            detail[typeKey].N += (counts.N || 0); 
            detail[typeKey].H += (counts.H || 0); 
            detail[typeKey].V += (counts.V || 0); 
            detail[typeKey].C += (counts.C || 0);
        });
    });

    return Array.from(rowMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

export const generateMatrixData = (treeData: MatrixTreeNode[], matrix: any): MatrixRow[] => {
    const rawRows = aggregateData(treeData, matrix);
    let lastChap = "";
    return rawRows.map(r => {
        const showChap = r.chapterName !== lastChap;
        lastChap = r.chapterName;
        return {
            chapterName: showChap ? r.chapterName : "", unitName: r.unitName,
            TN: r.TN, TF: r.TF, KQ: r.KQ, TL: r.TL, total: r.total
        };
    });
};

export const generateSpecMatrixData = (treeData: MatrixTreeNode[], matrix: any): SpecRow[] => {
    const rawRows = aggregateData(treeData, matrix);
    const specRows: SpecRow[] = [];
    let lastChap = "";
    rawRows.forEach(unitRow => {
        let firstInUnit = true;
        const sortedDetails = Array.from(unitRow.details.values()).sort((a: SpecRow, b: SpecRow) => a.description.localeCompare(b.description));
        sortedDetails.forEach((d: SpecRow) => {
            const showChap = d.chapterName !== lastChap;
            if (showChap) lastChap = d.chapterName;
            specRows.push({
                chapterName: showChap ? d.chapterName : "",
                unitName: firstInUnit ? d.unitName : "",
                description: d.description,
                competencies: d.competencies,
                TN: d.TN, TF: d.TF, KQ: d.KQ, TL: d.TL
            });
            firstInUnit = false;
        });
    });
    return specRows;
};

// --- MAIN EXPORT FUNCTION ---
export const generateDocxBlob = async (treeData: MatrixTreeNode[], matrix: any, type: 'MATRIX' | 'SPEC' | 'COMBINED'): Promise<Blob> => {
    const borderStyle = {
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    };

    const cellCenter = (text: string | number, bold = false, merge?: any, shading?: string) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(text), bold })], alignment: AlignmentType.CENTER })],
        verticalAlign: VerticalAlign.CENTER,
        borders: borderStyle,
        ...merge,
        shading: shading ? { fill: shading } : undefined
    });

    const cellLeft = (text: string, bold = false) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(text), bold })], alignment: AlignmentType.LEFT })],
        verticalAlign: VerticalAlign.CENTER,
        borders: borderStyle
    });

    const createMatrixTable = (rows: MatrixRow[]) => {
        const headerRow1 = new TableRow({
            children: [
                cellCenter("STT", true, { rowSpan: 2 }, "EFEFEF"),
                cellCenter("Chủ đề", true, { rowSpan: 2 }, "EFEFEF"),
                cellCenter("Nội dung", true, { rowSpan: 2 }, "EFEFEF"),
                cellCenter("TN 4 PA", true, { columnSpan: 3 }, "EFEFEF"),
                cellCenter("TN Đ/S", true, { columnSpan: 3 }, "EFEFEF"),
                cellCenter("TL Ngắn", true, { columnSpan: 3 }, "EFEFEF"),
                cellCenter("Tự luận", true, { columnSpan: 3 }, "EFEFEF"),
                cellCenter("Tổng", true, { columnSpan: 3 }, "EFEFEF"),
            ]
        });
        const headerRow2 = new TableRow({
            children: [
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"),
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"),
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"),
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"),
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"),
            ]
        });
        const totalAll = { N: 0, H: 0, V: 0 };
        const dataRows = rows.map((r, i) => {
            totalAll.N += r.total.N; totalAll.H += r.total.H; totalAll.V += r.total.V;
            const c = (v: number) => v > 0 ? v : '';
            return new TableRow({
                children: [
                    cellCenter(i + 1), cellLeft(r.chapterName, true), cellLeft(r.unitName),
                    cellCenter(c(r.TN.N)), cellCenter(c(r.TN.H)), cellCenter(c(r.TN.V)),
                    cellCenter(c(r.TF.N)), cellCenter(c(r.TF.H)), cellCenter(c(r.TF.V)),
                    cellCenter(c(r.KQ.N)), cellCenter(c(r.KQ.H)), cellCenter(c(r.KQ.V)),
                    cellCenter(c(r.TL.N)), cellCenter(c(r.TL.H)), cellCenter(c(r.TL.V)),
                    cellCenter(c(r.total.N), true), cellCenter(c(r.total.H), true), cellCenter(c(r.total.V), true),
                ]
            });
        });
        const totalRow = new TableRow({
            children: [
                cellCenter("TỔNG CỘNG", true, { columnSpan: 3 }, "EFEFEF"),
                cellCenter("", false, { columnSpan: 12 }),
                cellCenter(totalAll.N, true, {}, "EFEFEF"), cellCenter(totalAll.H, true, {}, "EFEFEF"), cellCenter(totalAll.V, true, {}, "EFEFEF"),
            ]
        });
        return new Table({ rows: [headerRow1, headerRow2, ...dataRows, totalRow], width: { size: 100, type: WidthType.PERCENTAGE } });
    };

    const createSpecTable = (rows: SpecRow[]) => {
        const headerRow1 = new TableRow({
            children: [
                cellCenter("STT", true, { rowSpan: 2 }, "EFEFEF"),
                cellCenter("Chủ đề", true, { rowSpan: 2 }, "EFEFEF"),
                cellCenter("Nội dung", true, { rowSpan: 2 }, "EFEFEF"),
                cellCenter("Yêu cầu cần đạt", true, { rowSpan: 2 }, "EFEFEF"),
                cellCenter("Năng lực", true, { rowSpan: 2 }, "EFEFEF"),
                cellCenter("TN 4 PA", true, { columnSpan: 4 }, "EFEFEF"),
                cellCenter("TN Đ/S", true, { columnSpan: 4 }, "EFEFEF"),
                cellCenter("TL Ngắn", true, { columnSpan: 4 }, "EFEFEF"),
                cellCenter("Tự luận", true, { columnSpan: 4 }, "EFEFEF"),
            ]
        });
        const headerRow2 = new TableRow({
            children: [
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"), cellCenter("VC", true, {}, "EFEFEF"),
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"), cellCenter("VC", true, {}, "EFEFEF"),
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"), cellCenter("VC", true, {}, "EFEFEF"),
                cellCenter("NB", true, {}, "EFEFEF"), cellCenter("TH", true, {}, "EFEFEF"), cellCenter("VD", true, {}, "EFEFEF"), cellCenter("VC", true, {}, "EFEFEF"),
            ]
        });
        const dataRows = rows.map((r, i) => {
            const c = (v: number) => v > 0 ? v : '';
            return new TableRow({
                children: [
                    cellCenter(i + 1), cellLeft(r.chapterName, true), cellLeft(r.unitName), cellLeft(r.description),
                    cellLeft((r.competencies || []).join(', ')),
                    cellCenter(c(r.TN.N)), cellCenter(c(r.TN.H)), cellCenter(c(r.TN.V)), cellCenter(c(r.TN.C)),
                    cellCenter(c(r.TF.N)), cellCenter(c(r.TF.H)), cellCenter(c(r.TF.V)), cellCenter(c(r.TF.C)),
                    cellCenter(c(r.KQ.N)), cellCenter(c(r.KQ.H)), cellCenter(c(r.KQ.V)), cellCenter(c(r.KQ.C)),
                    cellCenter(c(r.TL.N)), cellCenter(c(r.TL.H)), cellCenter(c(r.TL.V)), cellCenter(c(r.TL.C)),
                ]
            });
        });
        return new Table({ rows: [headerRow1, headerRow2, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
    };

    const children = [];
    if (type === 'MATRIX' || type === 'COMBINED') {
        const matrixRows = generateMatrixData(treeData, matrix);
        children.push(new Paragraph({ text: "MA TRẬN ĐỀ KIỂM TRA", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
        children.push(createMatrixTable(matrixRows));
    }
    if (type === 'COMBINED') children.push(new Paragraph({ text: "", pageBreakBefore: true }));
    if (type === 'SPEC' || type === 'COMBINED') {
        const specRows = generateSpecMatrixData(treeData, matrix);
        children.push(new Paragraph({ text: "BẢNG ĐẶC TẢ KỸ THUẬT", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
        children.push(createSpecTable(specRows));
    }

    const doc = new Document({ sections: [{ properties: {}, children }] });
    return await Packer.toBlob(doc);
};

export const generateMatrixLatex = (rows: MatrixRow[], title = "KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ (CHUẨN BỘ GD&ĐT TỪ NĂM 2025)"): string => {
    const totalAll = { N: 0, H: 0, V: 0 };
    const c = (v: number) => v > 0 ? String(v) : '';

    const body = rows.map((r, i) => {
        totalAll.N += r.total.N; totalAll.H += r.total.H; totalAll.V += r.total.V;
        const chap = r.chapterName ? r.chapterName.replace(/[&_%$#]/g, '\\$&') : '';
        const unit = r.unitName ? r.unitName.replace(/[&_%$#]/g, '\\$&') : '';
        return `    ${i + 1} & ${chap} & ${unit} & ${c(r.TN.N)} & ${c(r.TN.H)} & ${c(r.TN.V)} & ${c(r.TF.N)} & ${c(r.TF.H)} & ${c(r.TF.V)} & ${c(r.KQ.N)} & ${c(r.KQ.H)} & ${c(r.KQ.V)} & ${c(r.TL.N)} & ${c(r.TL.H)} & ${c(r.TL.V)} & ${c(r.total.N)} & ${c(r.total.H)} & ${c(r.total.V)} \\\\ \\hline`;
    }).join('\n');

    const grandTotal = totalAll.N + totalAll.H + totalAll.V;

    return `
\\begin{center}
    \\textbf{\\large ${title}}\\\\
    \\vspace{0.2cm}
    \\small
    \\begin{tabular}{|c|p{3.5cm}|p{3.5cm}|c|c|c|c|c|c|c|c|c|c|c|c|c|c|c|}
    \\hline
    \\multirow{2}{*}{\\textbf{TT}} & \\multirow{2}{*}{\\textbf{Chủ đề}} & \\multirow{2}{*}{\\textbf{Nội dung}} & \\multicolumn{3}{c|}{\\textbf{Phần I (TN)}} & \\multicolumn{3}{c|}{\\textbf{Phần II (Đ/S)}} & \\multicolumn{3}{c|}{\\textbf{Phần III (KQ)}} & \\multicolumn{3}{c|}{\\textbf{Tự luận}} & \\multicolumn{3}{c|}{\\textbf{Tổng cộng}} \\\\ \\cline{4-18}
    & & & \\textbf{NB} & \\textbf{TH} & \\textbf{VD} & \\textbf{NB} & \\textbf{TH} & \\textbf{VD} & \\textbf{NB} & \\textbf{TH} & \\textbf{VD} & \\textbf{NB} & \\textbf{TH} & \\textbf{VD} & \\textbf{NB} & \\textbf{TH} & \\textbf{VD} \\\\ \\hline
${body}
    \\multicolumn{3}{|c|}{\\textbf{TỔNG CỘNG SỐ CÂU}} & \\multicolumn{3}{c|}{} & \\multicolumn{3}{c|}{} & \\multicolumn{3}{c|}{} & \\multicolumn{3}{c|}{} & \\textbf{${totalAll.N}} & \\textbf{${totalAll.H}} & \\textbf{${totalAll.V}} \\\\ \\hline
    \\multicolumn{3}{|c|}{\\textbf{TỔNG SỐ CÂU TOÀN BỘ}} & \\multicolumn{12}{c|}{} & \\multicolumn{3}{c|}{\\textbf{${grandTotal} câu}} \\\\ \\hline
    \\end{tabular}
\\end{center}
`;
};

export const generateSpecMatrixLatex = (rows: SpecRow[], title = "BẢNG ĐẶC TẢ KỸ THUẬT ĐỀ KIỂM TRA (CHUẨN BỘ GD&ĐT)"): string => {
    const c = (v: number) => v > 0 ? String(v) : '';

    const body = rows.map((r, i) => {
        const chap = r.chapterName ? r.chapterName.replace(/[&_%$#]/g, '\\$&') : '';
        const unit = r.unitName ? r.unitName.replace(/[&_%$#]/g, '\\$&') : '';
        const desc = r.description ? r.description.replace(/[&_%$#]/g, '\\$&') : '';
        const comp = (r.competencies || []).join(', ').replace(/[&_%$#]/g, '\\$&');
        const compText = comp ? ` \\newline \\textit{(${comp})}` : '';

        return `    ${i + 1} & ${chap} & ${unit} & ${desc}${compText} & ${c(r.TN.N)} & ${c(r.TN.H)} & ${c(r.TN.V)} & ${c(r.TN.C)} & ${c(r.TF.N)} & ${c(r.TF.H)} & ${c(r.TF.V)} & ${c(r.TF.C)} & ${c(r.KQ.N)} & ${c(r.KQ.H)} & ${c(r.KQ.V)} & ${c(r.KQ.C)} & ${c(r.TL.N)} & ${c(r.TL.H)} & ${c(r.TL.V)} & ${c(r.TL.C)} \\\\ \\hline`;
    }).join('\n');

    return `
\\begin{center}
    \\textbf{\\large ${title}}\\\\
    \\vspace{0.2cm}
    \\footnotesize
    \\begin{tabular}{|c|p{2.2cm}|p{2.5cm}|p{4.5cm}|c|c|c|c|c|c|c|c|c|c|c|c|c|c|c|c|}
    \\hline
    \\multirow{2}{*}{\\textbf{TT}} & \\multirow{2}{*}{\\textbf{Chủ đề}} & \\multirow{2}{*}{\\textbf{Nội dung}} & \\multirow{2}{*}{\\textbf{Yêu cầu cần đạt / Dạng toán}} & \\multicolumn{4}{c|}{\\textbf{Phần I}} & \\multicolumn{4}{c|}{\\textbf{Phần II}} & \\multicolumn{4}{c|}{\\textbf{Phần III}} & \\multicolumn{4}{c|}{\\textbf{Tự luận}} \\\\ \\cline{5-20}
    & & & & \\textbf{N} & \\textbf{H} & \\textbf{V} & \\textbf{C} & \\textbf{N} & \\textbf{H} & \\textbf{V} & \\textbf{C} & \\textbf{N} & \\textbf{H} & \\textbf{V} & \\textbf{C} & \\textbf{N} & \\textbf{H} & \\textbf{V} & \\textbf{C} \\\\ \\hline
${body}
    \\end{tabular}
\\end{center}
`;
};

export const generateCombinedLatex = (treeData: MatrixTreeNode[], matrix: any): string => {
    const matrixRows = generateMatrixData(treeData, matrix);
    const specRows = generateSpecMatrixData(treeData, matrix);

    return `\\documentclass[11pt,a4paper,landscape]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{top=1.5cm,bottom=1.5cm,left=1.5cm,right=1.5cm}
\\usepackage{multirow}
\\usepackage{array}

\\begin{document}

${generateMatrixLatex(matrixRows)}

\\newpage

${generateSpecMatrixLatex(specRows)}

\\end{document}
`;
};
