import { describe, it, expect } from 'vitest';
import { calculateCrc32, createZipBlob } from '../zipUtils';

describe('zipUtils', () => {
    it('calculates accurate CRC32 for sample strings', () => {
        const encoder = new TextEncoder();
        const bytes = encoder.encode('123456789');
        // Standard check value for '123456789' is 0xcbf43926
        expect(calculateCrc32(bytes)).toBe(0xcbf43926);
    });

    it('creates a valid ZIP blob with expected header signatures', async () => {
        const files = [
            { name: 'de_101.tex', content: '\\begin{document} De 1 \\end{document}' },
            { name: 'de_102.tex', content: '\\begin{document} De 2 \\end{document}' },
        ];

        const blob = createZipBlob(files);
        expect(blob.type).toBe('application/zip');
        expect(blob.size).toBeGreaterThan(100);

        const arrayBuffer = await blob.arrayBuffer();
        const view = new DataView(arrayBuffer);

        // Local header 1 signature
        expect(view.getUint32(0, true)).toBe(0x04034b50);

        // Check that end of central directory signature exists in buffer
        const uint8 = new Uint8Array(arrayBuffer);
        const hasEocd = uint8.some((b, i) =>
            b === 0x50 && uint8[i + 1] === 0x4b && uint8[i + 2] === 0x05 && uint8[i + 3] === 0x06
        );
        expect(hasEocd).toBe(true);
    });
});
