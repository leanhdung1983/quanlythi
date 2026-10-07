import { describe, expect, it } from 'vitest';
import { buildPracticeCatalog, practiceScope, practicePattern, matchesPracticeScope } from './eduLoopPractice.js';
describe('EduLoop form scopes', () => {
    it('keeps observed skills at the exact level and starter forms across levels', () => {
        const exact = practiceScope('2D1H1-1');
        expect(matchesPracticeScope({ id_full: '[12D1B1-1]' }, exact)).toBe(true);
        expect(matchesPracticeScope({ id_full: '2D1V1-1' }, exact)).toBe(false);
        expect(matchesPracticeScope({ id_full: '2D1V1-1' }, practiceScope('2-D-1-1-1'))).toBe(true);
        expect(matchesPracticeScope({ id_full: '2D1H1-2' }, exact)).toBe(false);
        expect(matchesPracticeScope({ id_full: '2H1H1-1' }, exact)).toBe(false);
        expect(practicePattern(exact)).toContain('(H|B)');
        expect(practiceScope('invalid')).toBeNull();
    });
    it('lists real curriculum forms without manufacturing evidence or mastery', () => {
        const forms = buildPracticeCatalog([
            { id_full: '2D1N1-1', type: 'TN', question_count: 3, unit_name: 'Đạo hàm', description: 'Xét đơn điệu' },
            { id_full: '[12D1B1-1]', type: 'KQ', question_count: 2 },
            { id_full: '2D1N1-1', type: 'TL', question_count: 99 },
            { id_full: 'UNKNOWN', type: 'TN' },
        ]);
        expect(forms).toHaveLength(1); expect(forms[0].key).toBe('2-D-1-1-1');
        expect(forms[0].available).toBe(5); expect(forms[0].levels).toEqual({ N: 3, H: 2 });
        expect(forms[0].types).toEqual({ TN: 3, KQ: 2 }); expect(forms[0]).not.toHaveProperty('rate');
    });
});
