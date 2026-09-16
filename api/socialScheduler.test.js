import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); vi.doUnmock('./core.js'); });

describe('scheduled Facebook publishing', () => {
    it('claims one due post and increments usage only after Meta confirms it', async () => {
        vi.stubEnv('FACEBOOK_PAGE_ACCESS_TOKEN', 'private-test-token');
        vi.stubEnv('FACEBOOK_PAGE_ID', '100105564680397');
        let claimed = false;
        const transactionQuery = vi.fn(async sql => {
            if (sql.includes("status='POSTED'")) return [{ affectedRows: 1 }];
            return [{ affectedRows: 1 }];
        });
        const conn = { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(), query: transactionQuery };
        const fakePool = {
            query: vi.fn(async sql => {
                if (sql.includes("SET status='PUBLISHING'")) {
                    if (claimed) return [{ affectedRows: 0 }];
                    claimed = true; return [{ affectedRows: 1 }];
                }
                if (sql.includes('WHERE claim_token=? LIMIT 1')) return [[{
                    id: 1, question_id: 42, caption: 'Bài toán', image_mime: 'image/png', image_blob: Buffer.from('image')
                }]];
                return [{ affectedRows: 0 }];
            }), getConnection: vi.fn(async () => conn)
        };
        vi.doMock('./core.js', () => ({ pool: fakePool, initDbPromise: Promise.resolve() }));
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ id: 'photo-1', post_id: 'post-1' }) })));
        const { publishDuePosts } = await import('./socialPublisher.js');
        expect(await publishDuePosts()).toBe(1);
        expect(transactionQuery.mock.calls.filter(([sql]) => sql.includes('used_count=used_count+1'))).toHaveLength(1);
        expect(conn.commit).toHaveBeenCalledOnce();
    });

    it('does not retry a network-uncertain publish result', async () => {
        vi.stubEnv('FACEBOOK_PAGE_ACCESS_TOKEN', 'private-test-token');
        let claimed = false;
        const fakePool = { query: vi.fn(async sql => {
            if (sql.includes("SET status='PUBLISHING'")) {
                if (claimed) return [{ affectedRows: 0 }];
                claimed = true; return [{ affectedRows: 1 }];
            }
            if (sql.includes('WHERE claim_token=? LIMIT 1')) return [[{
                id: 1, question_id: 42, caption: 'Bài toán', image_mime: 'image/png', image_blob: Buffer.from('image')
            }]];
            return [{ affectedRows: 1 }];
        }) };
        vi.doMock('./core.js', () => ({ pool: fakePool, initDbPromise: Promise.resolve() }));
        vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('connection lost'); }));
        const { publishDuePosts } = await import('./socialPublisher.js');
        expect(await publishDuePosts()).toBe(1);
        expect(fakePool.query.mock.calls.some(([sql, args]) => sql.includes('SET status=?,last_error=?') && args[0] === 'UNCERTAIN')).toBe(true);
    });
});
