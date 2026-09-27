export function classifyGeminiFailure(error) {
    const message = String(error?.message || error || '');
    const lower = message.toLowerCase();
    const status = Number(error?.status || error?.code || 0);
    const invalidKey = /api[_ ]?key.*(?:invalid|expired)|api_key_invalid|consumer_suspended/.test(lower);
    const quota = status === 429 || /429|resource_exhausted|quota|rate.?limit|too many requests/.test(lower);
    const daily = quota && /per day|requests per day|daily|rpd|quota metric.*day/.test(lower);
    const unavailable = status === 408 || status === 500 || status === 502 || status === 503 || status === 504
        || /unavailable|timeout|timed out|deadline_exceeded/.test(lower);
    const retryMatch = message.match(/retry(?:Delay| after)?[^0-9]{0,20}(\d+(?:\.\d+)?)\s*s/i);
    const retryAfterMs = retryMatch ? Math.ceil(Number(retryMatch[1]) * 1000) : 0;
    return { invalidKey, quota, daily, unavailable, transient: quota || unavailable, retryAfterMs };
}

export function cooldownForFailure(failure) {
    if (failure.invalidKey) return 24 * 60 * 60 * 1000;
    if (failure.daily) return 6 * 60 * 60 * 1000;
    if (failure.quota) return Math.max(60_000, Math.min(failure.retryAfterMs || 60_000, 10 * 60_000));
    if (failure.unavailable) return Math.max(5_000, Math.min(failure.retryAfterMs || 15_000, 60_000));
    return 0;
}

export function orderAvailableAttempts(keys, models, cooldowns, now = Date.now()) {
    const attempts = [];
    let earliestRetryAt = Infinity;
    // Quota is model-specific. Try another model on the current key before
    // walking every key, because keys from one Cloud project share quota.
    for (let index = 0; index < keys.length; index++) {
        for (const model of models) {
            const id = `${keys[index]}\u0000${model}`;
            const retryAt = cooldowns.get(id) || 0;
            if (retryAt <= now) attempts.push({ key: keys[index], keyIndex: index, model, id });
            else earliestRetryAt = Math.min(earliestRetryAt, retryAt);
        }
    }
    return { attempts, earliestRetryAt };
}
