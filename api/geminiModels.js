const DISCOVERY_TTL_MS = 6 * 60 * 60 * 1000;

const FALLBACK_MODELS = [
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash'
];

let modelCache = { models: [], expiresAt: 0 };
let discoveryPromise = null;

function normalizeModelName(model) {
    return String(model?.name || model?.baseModelId || '')
        .replace(/^models\//, '')
        .trim();
}

function supportsGenerateContent(model) {
    const actions = model?.supportedActions || model?.supportedGenerationMethods || [];
    return actions.some(action => String(action).toLowerCase() === 'generatecontent');
}

function isTextFlashModel(name) {
    return /^gemini-/i.test(name)
        && /flash/i.test(name)
        && !/(live|tts|image|imagen|embedding|aqa)/i.test(name);
}

function versionParts(name) {
    const match = name.match(/gemini-(\d+)(?:\.(\d+))?/i);
    return match ? [Number(match[1]), Number(match[2] || 0)] : [0, 0];
}

export function rankGeminiModels(models, preference = 'flash') {
    const unique = [...new Set(models.map(normalizeModelName).filter(isTextFlashModel))];
    return unique.sort((a, b) => {
        const aPreview = /(preview|exp|experimental)/i.test(a) ? 1 : 0;
        const bPreview = /(preview|exp|experimental)/i.test(b) ? 1 : 0;
        if (aPreview !== bPreview) return aPreview - bPreview;
        if (preference === 'lite') {
            const liteDelta = Number(/lite/i.test(b)) - Number(/lite/i.test(a));
            if (liteDelta) return liteDelta;
        }
        const [aMajor, aMinor] = versionParts(a);
        const [bMajor, bMinor] = versionParts(b);
        if (aMajor !== bMajor) return bMajor - aMajor;
        if (aMinor !== bMinor) return bMinor - aMinor;
        const stableDelta = Number(/-latest$/i.test(b)) - Number(/-latest$/i.test(a));
        if (stableDelta) return stableDelta;
        return a.localeCompare(b);
    });
}

async function fetchAvailableModels(client) {
    const pager = await client.models.list({ config: { pageSize: 1000, queryBase: true } });
    const models = [];
    for await (const model of pager) {
        if (supportsGenerateContent(model)) models.push(model);
    }
    return models;
}

export async function resolveGeminiModels(client, configuredModels = [], preference = 'flash', now = Date.now()) {
    if (modelCache.expiresAt <= now && !discoveryPromise) {
        discoveryPromise = fetchAvailableModels(client)
            .then(models => {
                modelCache = { models, expiresAt: Date.now() + DISCOVERY_TTL_MS };
                console.info(`[AI] Đã tự khám phá ${models.length} model Gemini hỗ trợ generateContent.`);
                return models;
            })
            .catch(error => {
                console.warn(`[AI] Không thể cập nhật danh sách model Gemini, dùng danh sách dự phòng: ${error?.message || error}`);
                return modelCache.models;
            })
            .finally(() => { discoveryPromise = null; });
    }

    const discovered = discoveryPromise ? await discoveryPromise : modelCache.models;
    const ranked = rankGeminiModels(discovered, preference);
    const aliases = preference === 'lite' ? [] : ['gemini-flash-latest'];
    return [...new Set([...aliases, ...ranked, ...configuredModels, ...FALLBACK_MODELS])];
}

export function resetGeminiModelCacheForTests() {
    modelCache = { models: [], expiresAt: 0 };
    discoveryPromise = null;
}
