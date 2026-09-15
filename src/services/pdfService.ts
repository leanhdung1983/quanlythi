
/**
 * Extracts text from a PDF file using CDN-hosted PDF.js to avoid local build issues.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
        // Use dynamic import to load library from CDN at runtime
        // @ts-ignore
        const pdfjsLib = await import(/* @vite-ignore */ 'https://esm.sh/pdfjs-dist@4.0.379');
        
        // Worker configuration
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // FIX: Luôn thêm ký tự xuống dòng giữa các item text để tránh dính chữ
            // PDF.js thường trả về các text block rời rạc, nếu nối bằng '' thì ID sẽ dính vào từ trước đó
            const pageText = textContent.items.map((item: any) => {
                // Thêm newline nếu item có cờ EOL hoặc chỉ đơn giản là nối bằng newline để an toàn cho Regex
                return item.str + '\n'; 
            }).join('');
            
            fullText += `% --- Page ${i} ---\n${pageText}\n\n`;
        }
        return fullText;
    } catch (error: any) {
        console.error("PDF Extraction Error:", error);
        throw new Error("Không thể đọc file PDF. Lỗi: " + (error.message || error));
    }
};
