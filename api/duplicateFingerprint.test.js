import { describe, expect, it, vi } from 'vitest';
import { canonicalDuplicateSource, duplicateFingerprint, groupExactDuplicates, updateDuplicateFingerprint, resolveDuplicateGroups } from './duplicateFingerprint.js';

describe('duplicate fingerprints', () => {
    it('ignores question IDs, comments and formatting while preserving answer markers', () => {
        const one = '\\begin{ex}%[2D1H1-1]\nFind $x$. \\choice{\\True $2$}{$1$}{$3$}{$4$}\\loigiai{Proof}\\end{ex}';
        const two = '\\begin{ex} %[2D1H2-2]%Câu 3\nFind $x$.\n\\choice\n{\\True $2$}\n{$1$}\n{$3$}\n{$4$}\n\\loigiai{\nProof\n}\n\\end{ex}';
        expect(duplicateFingerprint(one)).toBe(duplicateFingerprint(two));
        expect(duplicateFingerprint(one)).not.toBe(duplicateFingerprint(one.replace('\\True $2$', '$2$')));
    });
    it.each([
        ['$x^{12}$', '$x^1{2}$'],
        ['$A$', '$a$'],
        ['a b', 'ab'],
        ['{Một} hai', '{Một}hai'],
        ['\\loigiai{}', '\\loigiai{nội dung lời giải}'],
        ['\\frac{1}{23}', '\\frac{12}{3}'],
        ['\\choice{one}{two}', '\\choiceTF{one}{two}'],
    ])('keeps mathematically distinct sources separate: %s', (a, b) => {
        expect(duplicateFingerprint(a)).not.toBe(duplicateFingerprint(b));
    });
    it('preserves escaped percent signs and detects real comments after escaped backslashes', () => {
        expect(canonicalDuplicateSource('Value 50\\% % comment')).toBe('Value 50\\%');
        expect(canonicalDuplicateSource('line\\\\%comment\nnext')).toBe('line\\\\ next');
    });
    it('uses original TikZ source and rejects stale broad-hash collisions and empty records', () => {
        const rows = [
            {id:1, raw_latex:'rendered1.svg', original_latex:'$A$'},
            {id:2, raw_latex:'rendered2.svg', original_latex:'$A$'},
            {id:3, raw_latex:'$a$'}, {id:4, raw_latex:''}, {id:5, raw_latex:''},
        ];
        expect(groupExactDuplicates(rows).map(group => group.map(row => row.id))).toEqual([[1,2]]);
    });
    it('marks the fingerprint current only if the source has not changed during hashing', async () => {
        const run = vi.fn().mockResolvedValue({affectedRows:0});
        const row = {id:4, content_latex:'rendered', content_latex_original:'$A$'};
        expect(await updateDuplicateFingerprint(run,row)).toBe(0);
        expect(run.mock.calls[0][0]).toContain('content_latex_original <=> ?');
        expect(run.mock.calls[0][1]).toEqual([duplicateFingerprint('$A$'),1,4,'rendered','$A$']);
    });
});

describe('duplicate resolution', () => {
    const makeConnection = rows => ({query:vi.fn(async sql => sql.startsWith('SELECT') ? [rows] : [{affectedRows:2}])});
    it('locks all sources, preserves each selected keeper and deletes only the extras', async () => {
        const conn = makeConnection([1,2,3,4].map(id => ({id, content_latex:id<=2?'One':'Two'})));
        expect(await resolveDuplicateGroups(conn,[{keepId:2,ids:[1,2]},{keepId:3,ids:[3,4]}])).toBe(2);
        expect(conn.query.mock.calls[0][0]).toContain('FOR UPDATE');
        expect(conn.query.mock.calls[1][1]).toEqual([[1,4]]);
    });
    it.each([
        [], [null], [{keepId:99,ids:[1,2]}], [{keepId:1,ids:[1,1]}],
        [{keepId:1,ids:[1,2]},{keepId:2,ids:[2,3]}], [{keepId:1,ids:[1,'2']}],
    ].map(groups => [groups]))('rejects invalid selections before querying the database', async groups => {
        const conn=makeConnection([]);
        await expect(resolveDuplicateGroups(conn,groups)).rejects.toMatchObject({status:400});
        expect(conn.query).not.toHaveBeenCalled();
    });
    it.each([
        [{id:1,content_latex:'$A$'},{id:2,content_latex:'$a$'}],
        [{id:1,content_latex:'$A$'}],
        [{id:1,content_latex:''},{id:2,content_latex:''}],
    ].map(rows => [rows]))('rejects changed, missing or empty sources without deleting anything', async rows => {
        const conn=makeConnection(rows);
        await expect(resolveDuplicateGroups(conn,[{keepId:1,ids:[1,2]}])).rejects.toMatchObject({status:409});
        expect(conn.query).toHaveBeenCalledTimes(1);
    });
});
