import { describe, expect, it } from 'vitest';
import { describeMatrix, normalizeGrade, parseMatrixData, validateCatalog, editableMatrixSections } from './matrixCatalog.js';
const matrix = { TN: { '2-D-1-1-0': { N: 2, H: 1, V: 0, C: 0 }, '1-H-3-2-0': { N: 1 }, '0-D-1-1-0': { N: 0 } } };
describe('matrix classification without changing legacy question matrices', () => {
    it('converts legacy array cells for editing without losing duplicate counts', () => {
        const row = { cls: 12, sub: 'D', chap: 1, unit: 2, count: 0, levels: { N: 2 } };
        const converted = editableMatrixSections({ TN: [row, row] });
        expect(converted.TN['2-D-1-2-0'].N).toBe(4);
        expect(editableMatrixSections({ matrix }).TN).toEqual(matrix.TN);
    });
    it('normalizes ID6 codes and actual grades without treating unknown values as grade 10', () => {
        expect([0,1,2,10,11,12,null,undefined,''].map(normalizeGrade)).toEqual([10,11,12,10,11,12,null,null,null]);
    });
    it('reads objects, legacy JSON and double-encoded JSON identically', () => {
        const data = { matrix, settings: { grade_id: 2 } };
        for (const input of [data, JSON.stringify(data), JSON.stringify(JSON.stringify(data))]) expect(parseMatrixData(input)).toEqual(data);
    });
    it('separates audience grade from multi-grade knowledge and includes both subjects', () => {
        const info = describeMatrix({ matrix_data: { matrix, settings: { grade_id: 2 } } });
        expect(info.grade).toBe('12'); expect(info.grades).toEqual([11,12]); expect(info.subjects).toEqual(['D','H']); expect(info.total).toBe(4);
        expect(info.purpose).toBe('UNCLASSIFIED');
    });
    it('never infers a single audience from the first item in a multi-grade matrix', () => {
        expect(describeMatrix({ matrix_data: matrix }).grade).toBe('MULTI');
        expect(describeMatrix({ matrix_data: { matrix, catalog: { target_grade: 11, purpose: 'FINAL' }, settings: { grade_id: 2 } } }).grade).toBe('11');
    });
    it('supports array format, zero-count cells and unknown/invalid legacy data', () => {
        const info = describeMatrix({ matrix_data: { TF: [{ cls: 0, sub: 'H', chap: 1, unit: 2, levels: { H: 3 } }] } });
        expect(info.grade).toBe('10'); expect(info.counts.TF).toBe(3);
        expect(describeMatrix({ matrix_data: { TN: {} } }).grade).toBe('UNKNOWN');
        expect(describeMatrix({ matrix_data: 'broken' }).valid).toBe(false);
    });
    it('validates classification and school years before any persistence', () => {
        expect(validateCatalog({ target_grade: 'MULTI', purpose: 'GRADUATION', term: 'YEAR', year: '2026-2027', status: 'READY' })).toMatchObject({ target_grade: 'MULTI', year: '2026-2027' });
        for (const invalid of [{ target_grade: 99 }, { purpose: 'INVALID' }, { status: 'APPROVED' }, { term: '3' }, { year: '2026-2028' }, { year: 'abc' }]) expect(() => validateCatalog(invalid)).toThrow();
    });
});
