/**
 * Pure client-side zero-dependency ZIP archive builder (PKZIP 2.0 Store format)
 * Produces valid .zip files compliant with standard unzippers (Windows Explorer, 7-Zip, macOS, etc.)
 */

export interface ZipEntry {
    name: string;
    content: string | Uint8Array;
}

// Precomputed CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
}

export function calculateCrc32(bytes: Uint8Array): number {
    let crc = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
}

export function createZipBlob(files: ZipEntry[]): Blob {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];
    const centralHeaders: Uint8Array[] = [];

    let currentOffset = 0;

    for (const file of files) {
        const nameBytes = encoder.encode(file.name);
        const dataBytes = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
        const crc = calculateCrc32(dataBytes);
        const size = dataBytes.length;

        // 1. Local Header (30 bytes)
        const localHeader = new Uint8Array(30);
        const localView = new DataView(localHeader.buffer);
        localView.setUint32(0, 0x04034b50, true);  // Local file header signature
        localView.setUint16(4, 20, true);          // Version needed (2.0)
        localView.setUint16(6, 0x0800, true);      // General purpose bit flag (UTF-8)
        localView.setUint16(8, 0, true);           // Compression method (0 = STORE)
        localView.setUint16(10, 0, true);          // Last mod time
        localView.setUint16(12, 0, true);          // Last mod date
        localView.setUint32(14, crc, true);        // CRC-32
        localView.setUint32(18, size, true);       // Compressed size
        localView.setUint32(22, size, true);       // Uncompressed size
        localView.setUint16(26, nameBytes.length, true); // Filename length
        localView.setUint16(28, 0, true);          // Extra field length

        parts.push(localHeader, nameBytes, dataBytes);

        // 2. Central Directory Header (46 bytes)
        const centralHeader = new Uint8Array(46);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true); // Central directory header signature
        centralView.setUint16(4, 20, true);         // Version made by
        centralView.setUint16(6, 20, true);         // Version needed
        centralView.setUint16(8, 0x0800, true);     // General purpose bit flag (UTF-8)
        centralView.setUint16(10, 0, true);         // Compression method (0 = STORE)
        centralView.setUint16(12, 0, true);         // Last mod time
        centralView.setUint16(14, 0, true);         // Last mod date
        centralView.setUint32(16, crc, true);       // CRC-32
        centralView.setUint32(20, size, true);      // Compressed size
        centralView.setUint32(24, size, true);      // Uncompressed size
        centralView.setUint16(28, nameBytes.length, true); // Filename length
        centralView.setUint16(30, 0, true);         // Extra field length
        centralView.setUint16(32, 0, true);         // File comment length
        centralView.setUint16(34, 0, true);         // Disk number start
        centralView.setUint16(36, 0, true);         // Internal file attributes
        centralView.setUint32(38, 0, true);         // External file attributes
        centralView.setUint32(42, currentOffset, true); // Relative offset of local header

        centralHeaders.push(centralHeader, nameBytes);

        currentOffset += localHeader.length + nameBytes.length + dataBytes.length;
    }

    const centralDirOffset = currentOffset;
    let centralDirSize = 0;
    for (const h of centralHeaders) {
        centralDirSize += h.length;
    }

    // 3. End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);     // End of central dir signature
    eocdView.setUint16(4, 0, true);              // Number of this disk
    eocdView.setUint16(6, 0, true);              // Disk where central dir starts
    eocdView.setUint16(8, files.length, true);   // Number of central dir records on this disk
    eocdView.setUint16(10, files.length, true);  // Total number of central dir records
    eocdView.setUint32(12, centralDirSize, true);// Size of central directory
    eocdView.setUint32(16, centralDirOffset, true); // Offset of central directory
    eocdView.setUint16(20, 0, true);             // Comment length

    const allParts = [...parts, ...centralHeaders, eocd];
    return new Blob(allParts as unknown as BlobPart[], { type: 'application/zip' });
}

export function downloadZip(filename: string, files: ZipEntry[]): void {
    const blob = createZipBlob(files);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.zip') ? filename : `${filename}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
