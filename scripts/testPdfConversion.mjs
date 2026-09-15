import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey, generateWithFallback, parseGeminiError } from '../api/core.js';
import { convertPdfToExTest } from '../api/pdfToExTest.js';

const pdfPath = process.argv[2];
if (!pdfPath) throw new Error('Provide the PDF path.');

try {
    const bytes = await fs.readFile(pdfPath);
    if (bytes.length > 20 * 1024 * 1024) throw new Error('PDF exceeds the converter limit.');
    const apiKey = await getGeminiApiKey(null);
    if (!apiKey) throw new Error('No system Gemini key is configured.');

    const result = await convertPdfToExTest(bytes, new GoogleGenAI({ apiKey }),
        progress => console.log(JSON.stringify({ type: 'progress', ...progress })), generateWithFallback);
    const outputPath = path.resolve('output', 'pdf-test', `${path.basename(pdfPath, path.extname(pdfPath)).replace(/[^A-Za-z0-9_-]/g, '_')}_paged.tex`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, result.latex, 'utf8');
    const content = result.latex;
    console.log(JSON.stringify({
        outputPath,
        questionCount: result.questionCount,
        expectedQuestionCount: result.expectedQuestionCount,
        missingQuestionNumbers: result.missingQuestionNumbers,
        requestCount: result.requestCount,
        complete: result.complete,
        warnings: result.warnings,
        outputCharacters: content.length,
        begins: (content.match(/\\begin\{ex\}/g) || []).length,
        ends: (content.match(/\\end\{ex\}/g) || []).length,
        choices: (content.match(/\\choice\b/g) || []).length,
        solutions: (content.match(/\\loigiai\b/g) || []).length,
        visualReviewMarkers: (content.match(/CAN_KIEM_TRA_HINH/g) || []).length,
        pageCount: result.pageCount
    }));
} catch (error) {
    console.error(parseGeminiError(error));
    process.exitCode = 1;
}
process.exit();
