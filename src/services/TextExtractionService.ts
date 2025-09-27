import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface TextExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
  pageCount?: number;
}

export class TextExtractionService {
  static async extractText(file: File): Promise<TextExtractionResult> {
    try {
      const fileType = file.type;
      
      switch (fileType) {
        case 'application/pdf':
          return await this.extractFromPDF(file);
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromWord(file);
        case 'text/plain':
          return await this.extractFromText(file);
        default:
          return {
            success: false,
            error: 'Unsupported file type'
          };
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }

  private static async extractFromPDF(file: File): Promise<TextExtractionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;
      
      let fullText = '';
      
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      return {
        success: true,
        text: fullText.trim(),
        pageCount
      };
    } catch (error) {
      return {
        success: false,
        error: `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async extractFromWord(file: File): Promise<TextExtractionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return {
        success: true,
        text: result.value
      };
    } catch (error) {
      return {
        success: false,
        error: `Word document extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async extractFromText(file: File): Promise<TextExtractionResult> {
    try {
      const text = await file.text();
      
      return {
        success: true,
        text
      };
    } catch (error) {
      return {
        success: false,
        error: `Text file extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Replace multiple line breaks with double line break
      .trim();
  }

  static getTextPreview(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return truncated.substring(0, lastSpace) + '...';
  }
}