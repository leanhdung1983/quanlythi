import { describe, it, expect } from 'vitest';
import { generateDocxBlob, generateCombinedLatex } from '../matrixExportUtils';

describe('Matrix Export Test', () => {
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
