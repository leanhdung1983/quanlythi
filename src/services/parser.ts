
import { Chapter, Unit, ID6Metadata, ParsedData, QuestionType } from '../types';
import { normalizeID } from '../utils/id6Helper';

// Regex linh hoạt: Chấp nhận khoảng trắng và ký tự lạ (legacy) để tham chiếu
// Updated: [A-Z]+ for Subject/Level instead of specific lists, supports _ or -
const ID6_REGEX_FLEXIBLE = /\[\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*[-_]\s*(\d+)\s*\]/i;

export const parseMetadataFile = (text: string): ParsedData => {
  // 1. CHUẨN HOÁ VĂN BẢN (QUAN TRỌNG)
  const cleanText = text
    .replace(/\r\n/g, '\n') // Chuẩn hoá xuống dòng
    .replace(/\r/g, '\n')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-') // Thay thế TẤT CẢ các loại gạch ngang đặc biệt thành gạch ngang thường (-)
    .replace(/[\u2022\u25E6\u25AA]/g, '-') // Thay thế bullet points thành gạch ngang
    .replace(/\t/g, '    '); // Tab thành space

  const lines = cleanText.split('\n');
  
  const chapters: Chapter[] = [];
  const units: Unit[] = [];
  const metadata: ID6Metadata[] = [];

  // Context state
  let currentClass = 0; // 0=10, 1=11, 2=12
  let currentSubject = 'D';
  let currentChapterNum = 0;
  let currentChapterId = 0; 
  let currentChapterName = ''; // Track Name
  let currentUnitNum = 0;
  let currentUnitName = '';    // Track Name
  
  // Dùng Map để tránh trùng lặp
  const chapterMap = new Map<string, number>(); // Key: "Class-Sub-Num" -> Id
  const unitMap = new Map<string, number>();    // Key: "ChapId-Num" -> Id

  let chapIdCounter = 1;
  let unitIdCounter = 1;
  let metaIdCounter = 1;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // --- LOGIC PHÂN TÍCH CÂY (HIERARCHY) ---
    const hierarchyMatch = trimmed.match(/^([-]+)\s*\[\s*([0-9A-Za-z]+)\s*\]\s*(.*)/);

    if (hierarchyMatch) {
        const dashes = hierarchyMatch[1].length;
        const code = hierarchyMatch[2].toUpperCase();
        const content = hierarchyMatch[3].trim();

        // Level 1: Grade (1-3 dashes) - [0], [1], [2] or [10], [11], [12]
        if (dashes >= 1 && dashes <= 3) {
            let val = parseInt(code);
            if (val === 10) val = 0;
            else if (val === 11) val = 1;
            else if (val === 12) val = 2;
            currentClass = isNaN(val) ? 0 : val;
            return;
        }

        // Level 2: Subject (4-6 dashes) - [D], [H]
        if (dashes >= 4 && dashes <= 6) {
            currentSubject = code;
            return;
        }

        // Level 3: Chapter (7-9 dashes) - [1], [2]...
        if (dashes >= 7 && dashes <= 9) {
            const num = parseInt(code);
            currentChapterNum = isNaN(num) ? 0 : num;
            const cName = content || `Chương ${currentChapterNum}`;
            currentChapterName = cName; // Save for Metadata context

            const key = `${currentClass}-${currentSubject}-${currentChapterNum}`;
            
            // Kiểm tra xem chương này đã tồn tại trong mảng chưa (để tránh tạo lại khi parse nhiều file)
            // Ở đây ta tạo giả lập ID
            if (!chapterMap.has(key)) {
                const newChap = {
                    id: chapIdCounter++,
                    grade_id: 0, subject_id: 0,
                    chapter_number: currentChapterNum,
                    name: cName,
                    id_class: currentClass,
                    id_subject: currentSubject,
                    id_chapter: currentChapterNum,
                    chapter_name: cName
                };
                chapters.push(newChap);
                chapterMap.set(key, newChap.id);
                currentChapterId = newChap.id;
            } else {
                currentChapterId = chapterMap.get(key)!;
            }
            return;
        }

        // Level 4: Unit (10-12 dashes) - [1], [2]...
        if (dashes >= 10 && dashes <= 12) {
            const num = parseInt(code);
            currentUnitNum = isNaN(num) ? 0 : num;
            const uName = content || `Bài ${currentUnitNum}`;
            currentUnitName = uName; // Save for Metadata context

            const key = `${currentChapterId}-${currentUnitNum}`;

            if (!unitMap.has(key)) {
                const newUnit: any = {
                    id: unitIdCounter++,
                    chapter_id: currentChapterId,
                    unit_number: currentUnitNum,
                    name: uName,
                    id_unit: currentUnitNum,
                    unit_name: uName,
                    // UPDATE: Gắn thêm context để Backend dễ xử lý (Map temp ID -> real DB ID)
                    id_class: currentClass,
                    id_subject: currentSubject,
                    id_chapter: currentChapterNum
                };
                units.push(newUnit);
                unitMap.set(key, newUnit.id);
            }
            return;
        }

        // Level 5: Type/Metadata (13+ dashes) - [1], [2]...
        if (dashes >= 13) {
            const num = parseInt(code);
            const typeCount = isNaN(num) ? 0 : num;
            const desc = content || `Dạng ${typeCount}`;

            // Tự động sinh 4 mức độ (N, H, V, C) cho mỗi định nghĩa dạng
            const levels = ['N', 'H', 'V', 'C'];
            levels.forEach(lvl => {
                const idFull = `${currentClass}${currentSubject}${currentChapterNum}${lvl}${currentUnitNum}-${typeCount}`;
                
                // Tránh trùng lặp trong cùng 1 lần import
                if (!metadata.some(m => m.id_full === idFull)) {
                    metadata.push({
                        id: metaIdCounter++,
                        id_full: idFull,
                        description: desc,
                        count_id: typeCount,
                        id_class: currentClass,
                        id_subject: currentSubject,
                        id_chapter: currentChapterNum,
                        id_unit: currentUnitNum,
                        id_level: lvl,
                        id_count: typeCount,
                        // NEW: Pass explicit names to backend for updates
                        chapter_name: currentChapterName,
                        unit_name: currentUnitName
                    });
                }
            });
            return;
        }
    }

    // --- LOGIC 2: Fallback cho các dòng code trực tiếp (nếu có) ---
    // Ví dụ: [2D1H1-1] Mô tả...
    const directCodeMatch = trimmed.match(ID6_REGEX_FLEXIBLE);
    if (directCodeMatch) {
        const fullCode = directCodeMatch[0]; 
        let rawClass = parseInt(directCodeMatch[1]);
        if (rawClass === 10) rawClass = 0;
        else if (rawClass === 11) rawClass = 1;
        else if (rawClass === 12) rawClass = 2;
        rawClass = isNaN(rawClass) ? 0 : rawClass;

        const rawSubject = directCodeMatch[2].toUpperCase();
        
        const chapNum = parseInt(directCodeMatch[3]);
        const rawChapter = isNaN(chapNum) ? 0 : chapNum;
        
        const rawLevel = directCodeMatch[4].toUpperCase();
        
        const unitNum = parseInt(directCodeMatch[5]);
        const rawUnit = isNaN(unitNum) ? 0 : unitNum;
        
        const countNum = parseInt(directCodeMatch[6]);
        const rawCount = isNaN(countNum) ? 0 : countNum;
        
        const desc = trimmed.replace(fullCode, '').trim();

        const addMeta = (lvl: string) => {
             const idStr = `${rawClass}${rawSubject}${rawChapter}${lvl}${rawUnit}-${rawCount}`;
             if (!metadata.some(m => m.id_full === idStr)) {
                metadata.push({
                    id: metaIdCounter++,
                    id_full: idStr,
                    description: desc,
                    count_id: rawCount,
                    id_class: rawClass, id_subject: rawSubject, id_chapter: rawChapter, id_unit: rawUnit, id_level: lvl, id_count: rawCount,
                    // Note: Direct code match does not know the chapter/unit name from hierarchy
                    // So we leave them undefined, backend will use generic "Chương X" if needed.
                });
             }
        };

        if (rawLevel === 'X') {
             ['N', 'H', 'V', 'C'].forEach(lvl => addMeta(lvl));
        } else {
            // Check for legacy level (Y,B,K,G) and normalize
            // If it's a specific level (even legacy), add just that one row after normalization
            // BUT metadata definitions usually imply N,H,V,C existence. 
            // For now, let's normalize it to N/H/V/C and add it.
            // If the user provided [2D1Y1-1], we treat it as N.
            const normalizedLvl = normalizeID(`${rawClass}${rawSubject}${rawChapter}${rawLevel}${rawUnit}-${rawCount}`).charAt(3);
            addMeta(normalizedLvl);
        }
    }
  });

  return { chapters, units, metadata };
};

export const detectQuestionTypeFromLatex = (latex: string): QuestionType => {
    if (/\\choiceTF/i.test(latex)) return QuestionType.TF;
    if (/\\choice/i.test(latex)) return QuestionType.TN;
    if (/\\shortans/i.test(latex)) return QuestionType.KQ;
    return QuestionType.TL;
};

export const parseTexFile = (text: string): { questions: Partial<import('../types').Question>[] } => {
    const questions: Partial<import('../types').Question>[] = [];
    const regex = /\\begin\{(ex|bt|vd|cau|bai|tuluan|tl)\}([\s\S]*?)\\end\{\1\}/gi;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        const envType = match[1];
        const rawContent = match[2];
        let fullLatex = `\\begin{ex}${rawContent}\\end{ex}`;

        const endIndex = match.index + match[0].length;
        const textAfter = text.substring(endIndex);
        const envMatch = textAfter.match(/^\s*\\begin\{loigiai\}([\s\S]*?)\\end\{loigiai\}/i);
        if (envMatch) {
            fullLatex += envMatch[0];
        } else {
            const cmdMatch = textAfter.match(/^\s*\\loigiai\s*\{/i);
            if (cmdMatch) {
                let braceCount = 0;
                let i = cmdMatch[0].length;
                let foundEnd = false;
                for (; i < textAfter.length; i++) {
                    if (textAfter[i] === '{') braceCount++;
                    else if (textAfter[i] === '}') {
                        if (braceCount === 0) {
                            foundEnd = true;
                            i++; 
                            break;
                        }
                        braceCount--;
                    }
                }
                if (foundEnd) {
                    fullLatex += textAfter.substring(0, i);
                }
            }
        }

        const head = rawContent.substring(0, 500);
        // Supports legacy IDs like [12D1Y1-1] or [10H2K3-1]
        const idMatch = head.match(/\[\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*([A-Z]+)\s*(\d+)\s*[-_]\s*(\d+)\s*\]/i);
        
        let id_full = "UNKNOWN";
        if (idMatch) {
            const [, cls, sub, chap, lvl, unit, cnt] = idMatch;
            const rawId = `${cls}${sub.toUpperCase()}${chap}${lvl.toUpperCase()}${unit}-${cnt}`;
            // Normalize ID immediately during import (e.g. Y -> N)
            id_full = normalizeID(rawId);
        }

        const q_type = detectQuestionTypeFromLatex(rawContent);
        
        // Extract choices if TN or TF
        let choices: string[] = [];
        if (q_type === QuestionType.TN || q_type === QuestionType.TF) {
            const choiceRegex = /\\choice(?:TF)?\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}/i;
            const cMatch = rawContent.match(choiceRegex);
            if (cMatch) {
                choices = [cMatch[1].trim(), cMatch[2].trim(), cMatch[3].trim(), cMatch[4].trim()];
            }
        }

        questions.push({
            id_full,
            raw_latex: fullLatex, 
            q_type: q_type,
            choices: choices.length > 0 ? choices : undefined
        });
    }
    return { questions };
}
