import { describe, expect, it } from 'vitest';
import { classifyGeminiFailure, cooldownForFailure, orderAvailableAttempts } from './geminiResilience.js';

describe('Gemini quota resilience', () => {
    it('distinguishes minute quota from daily quota', () => {
        expect(cooldownForFailure(classifyGeminiFailure({ status: 429, message: 'rate limit; retryDelay: 35s' }))).toBe(60000);
        expect(cooldownForFailure(classifyGeminiFailure({ status: 429, message: 'Requests per day quota exceeded' }))).toBe(21600000);
    });
    it('orders by model and skips cooling key/model pairs', () => {
        const cooldowns = new Map([['k1\u0000lite', 2000]]);
        const result = orderAvailableAttempts(['k1', 'k2'], ['lite', 'flash'], cooldowns, 1000);
        expect(result.attempts.map(item => `${item.key}:${item.model}`)).toEqual(['k1:flash', 'k2:lite', 'k2:flash']);
        expect(result.earliestRetryAt).toBe(2000);
    });
});
