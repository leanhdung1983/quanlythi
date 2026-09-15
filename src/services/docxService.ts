
import * as mammoth from 'mammoth';

/**
 * Reads a .docx file and extracts raw text content.
 * @param file The File object from input[type="file"]
 * @returns Promise resolving to the raw text string
 */
export const extractTextFromDocx = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error: any) {
    console.error("Error reading docx file:", error);
    // Provide user-friendly error message
    if (error.message && error.message.includes("end of stream")) {
        throw new Error("File DOCX bị lỗi hoặc không đúng định dạng XML (corrupted). Vui lòng thử 'Save As' lại file trong Word.");
    }
    throw new Error("Không thể đọc file .docx. Đảm bảo đây là file Word hợp lệ. Chi tiết: " + (error.message || "Unknown Error"));
  }
};
