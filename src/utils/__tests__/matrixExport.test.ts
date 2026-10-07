import { describe, it, expect } from 'vitest';
import { generateDocxBlob, generateCombinedLatex, generateSpecMatrixData, generateMatrixData } from '../matrixExportUtils';
import { prepareMatrixPayload } from '../matrixUtils';

describe('Matrix Export Test', () => {
    it('preserves lesson wildcard through online payload and export', async () => {
        const matrix = { TN: { '2-D-1-1-*': { N: 2, H: 1, V: 0, C: 0 } }, TF: {}, KQ: {}, TL: {} };
        expect(prepareMatrixPayload({ matrix }).TN[0].count).toBe('*');
        expect(generateCombinedLatex([], matrix)).toContain('ngẫu nhiên dạng');
        expect((await generateDocxBlob([], matrix, 'COMBINED')).size).toBeGreaterThan(1000);
    });
    const mockTreeData: any = [
        {
            grade: 2,
            subjects: [
                {
                    subject: 'D',
                    chapters: [
                        {
                            num: 1,
                            name: 'Ứng dụng đạo hàm để khảo sát hàm số',
                            units: [
                                {
                                    num: 1,
                                    name: 'Tính đơn điệu của hàm số',
                                    types: [
                                        { count_id: 1, description: 'Xét tính đơn điệu bằng bảng biến thiên', competencies: ['Năng lực tư duy'] },
                                        { count_id: 2, description: 'Tìm khoảng đơn điệu của hàm số cho bởi công thức', competencies: ['Năng lực giải quyết vấn đề'] }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ];

    it('should generate Word Blob from direct matrix object with data rows', async () => {
        const matrix = {
            TN: { '2-D-1-1-1': { N: 2, H: 1, V: 0, C: 0 } },
            TF: { '2-D-1-1-2': { N: 1, H: 0, V: 1, C: 0 } },
            KQ: {},
            TL: {}
        };
        const blob = await generateDocxBlob(mockTreeData, matrix, 'COMBINED');
        expect(blob).toBeDefined();
        expect(blob.size).toBeGreaterThan(1000);
    });

    it('expands lesson counts by real form capacity without changing the saved selection', () => {
        const tree = structuredClone(mockTreeData);
        tree[0].subjects[0].chapters[0].units[0].types[0].stats = { TN: { N: 3, H: 1 } };
        tree[0].subjects[0].chapters[0].units[0].types[1].stats = { TN: { N: 2, H: 2 } };
        const matrix = { TN: { '2-D-1-1-*': { N: 3, H: 2, V: 0, C: 0 }, '2-D-1-1-1': { N: 2, H: 0, V: 0, C: 0 } }, TF: {}, KQ: {}, TL: {} };
        const original = JSON.stringify(matrix);
        const rows = generateSpecMatrixData(tree, matrix);
        expect(rows.filter(r => r.description.includes('dự kiến'))).toHaveLength(2);
        expect(rows.reduce((n, r) => n + r.TN.N, 0)).toBe(5);
        expect(rows.reduce((n, r) => n + r.TN.H, 0)).toBe(2);
        const firstForm = rows.filter(r => r.description.includes('bảng biến thiên'));
        expect(firstForm.reduce((n, r) => n + r.TN.N, 0)).toBe(3);
        expect(generateMatrixData(tree, matrix)[0].unitName).toContain('Dạng bài:');
        expect(generateCombinedLatex(tree, matrix)).toContain('Mỗi lượt tạo đề vẫn chọn dạng ngẫu nhiên');
        expect(JSON.stringify(matrix)).toBe(original);
    });

    it('keeps unallocatable counts visible rather than inventing available forms', () => {
        const tree = structuredClone(mockTreeData);
        tree[0].subjects[0].chapters[0].units[0].types[0].stats = { TN: { N: 1 } };
        const matrix = { TN: { '12-D-1-1-*': { N: 3, H: 0, V: 0, C: 0 } } };
        const rows = generateSpecMatrixData(tree, matrix);
        expect(rows.reduce((n, r) => n + r.TN.N, 0)).toBe(3);
        expect(rows.find(r => r.description.includes('chưa đủ dữ liệu'))?.TN.N).toBe(2);
        expect(rows.find(r => r.description.includes('bảng biến thiên'))?.TN.N).toBe(1);
    });

    it('should generate Word Blob from nested matrix_data (as in ExamGenerator state & DB)', async () => {
        const wrappedInput = {
            name: 'Ma_tran_Lop_12_Kiem_Tra',
            matrix_data: JSON.stringify({
                matrix: {
                    TN: { '2-D-1-1-1': { N: 3, H: 2, V: 1, C: 0 } },
                    TF: {},
                    KQ: {},
                    TL: {}
                },
                settings: { duration: 90 }
            })
        };
        const blob = await generateDocxBlob(mockTreeData, wrappedInput, 'COMBINED');
        expect(blob).toBeDefined();
        expect(blob.size).toBeGreaterThan(1000);
    });

    it('should extract correct table contents into LaTeX matrix and specification tables', () => {
        const wrappedInput = {
            matrix: {
                TN: { '2-D-1-1-1': { N: 3, H: 2, V: 1, C: 0 } },
                TF: {},
                KQ: {},
                TL: {}
            },
            settings: { duration: 90 }
        };
        const tex = generateCombinedLatex(mockTreeData, wrappedInput);
        expect(tex).toBeDefined();
        expect(typeof tex).toBe('string');
        // Must contain chapter and unit names from metadata
        expect(tex).toContain('Tính đơn điệu của hàm số');
        expect(tex).toContain('Xét tính đơn điệu bằng bảng biến thiên');
        // Must contain non-zero aggregated counts
        expect(tex).toContain('3');
        expect(tex).toContain('2');
    });
});
