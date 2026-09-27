import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rankGeminiModels, resetGeminiModelCacheForTests, resolveGeminiModels } from './geminiModels.js';

describe('Gemini model discovery', () => {
    beforeEach(() => resetGeminiModelCacheForTests());

    it('prefers the newest stable text Flash model and excludes incompatible variants', () => {
        const ranked = rankGeminiModels([
            { name: 'models/gemini-4.0-flash-preview' },
            { name: 'models/gemini-3.8-flash' },
            { name: 'models/gemini-4.0-flash' },
            { name: 'models/gemini-5.0-flash-tts' },
            { name: 'models/text-embedding-999' }
        ]);
        expect(ranked).toEqual(['gemini-4.0-flash', 'gemini-3.8-flash', 'gemini-4.0-flash-preview']);
    });

    it('discovers once, caches the result, and keeps configured fallbacks', async () => {
        const list = vi.fn(async () => ({
            async *[Symbol.asyncIterator]() {
                yield { name: 'models/gemini-4.2-flash', supportedActions: ['generateContent'] };
                yield { name: 'models/gemini-4.2-flash-tts', supportedActions: ['generateContent'] };
                yield { name: 'models/gemini-4.1-pro', supportedActions: ['generateContent'] };
            }
        }));
        const client = { models: { list } };
        const first = await resolveGeminiModels(client, ['gemini-3.5-flash']);
        const second = await resolveGeminiModels(client, ['gemini-3.5-flash']);
        expect(first.slice(0, 2)).toEqual(['gemini-flash-latest', 'gemini-4.2-flash']);
        expect(first).toContain('gemini-3.5-flash');
        expect(second).toEqual(first);
        expect(list).toHaveBeenCalledTimes(1);
    });

    it('keeps Lite models first for low-cost classification jobs', () => {
        const ranked = rankGeminiModels([
            { name: 'models/gemini-4.2-flash' },
            { name: 'models/gemini-4.1-flash-lite' }
        ], 'lite');
        expect(ranked[0]).toBe('gemini-4.1-flash-lite');
    });

    it('falls back safely when model discovery is unavailable', async () => {
        const client = { models: { list: vi.fn(async () => { throw new Error('offline'); }) } };
        const models = await resolveGeminiModels(client, ['gemini-custom-flash']);
        expect(models).toContain('gemini-custom-flash');
        expect(models).toContain('gemini-flash-latest');
    });
});
