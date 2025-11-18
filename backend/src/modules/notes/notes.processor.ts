import { prisma } from '@/config';
import { textractClient } from '@/config/aws.config';
import {
  DetectDocumentTextCommand,
  AnalyzeDocumentCommand,
} from '@aws-sdk/client-textract';
import { NoteProcStatus } from '@prisma/client';
import { logger } from '@/config';
import { countWords } from '@/shared/utils';
import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse';
import axios from 'axios';

/**
 * Notes Processor
 * Handles OCR and AI processing of uploaded notes
 */
export class NotesProcessor {
  /**
   * Process note (main entry point)
   */
  async processNote(noteId: string): Promise<void> {
    try {
      logger.info(`Starting to process note: ${noteId}`);

      // Update status to PROCESSING
      await prisma.userNote.update({
        where: { id: noteId },
        data: { processingStatus: NoteProcStatus.PROCESSING },
      });

      // Get note details
      const note = await prisma.userNote.findUnique({
        where: { id: noteId },
      });

      if (!note) {
        throw new Error('Note not found');
      }

      const startTime = Date.now();

      // Extract text based on file type
      let extractedText: string;
      let pageCount: number | undefined;

      if (note.fileType === 'pdf') {
        const result = await this.extractTextFromPDF(note.fileUrl);
        extractedText = result.text;
        pageCount = result.pageCount;
      } else {
        // Image file
        extractedText = await this.extractTextFromImage(note.fileUrl);
        pageCount = 1;
      }

      // Count words
      const wordCount = countWords(extractedText);

      // Format notes using AI (TODO: integrate with AI service)
      const formattedNotes = await this.formatNotesWithAI(extractedText);

      // Generate summary (TODO: integrate with AI service)
      const summary = await this.generateSummary(extractedText);

      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      // Update note with processed data
      await prisma.userNote.update({
        where: { id: noteId },
        data: {
          extractedText,
          formattedNotes,
          summary,
          pageCount,
          wordCount,
          processingTime,
          processingStatus: NoteProcStatus.COMPLETED,
        },
      });

      logger.info(`Successfully processed note: ${noteId} in ${processingTime}s`);
    } catch (error: any) {
      logger.error(`Error processing note ${noteId}:`, error);

      // Update note with error status
      await prisma.userNote.update({
        where: { id: noteId },
        data: {
          processingStatus: NoteProcStatus.FAILED,
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Extract text from PDF using pdf-parse
   */
  private async extractTextFromPDF(fileUrl: string): Promise<{ text: string; pageCount: number }> {
    try {
      // Download PDF file
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);

      // Parse PDF
      const data = await pdfParse(buffer);

      return {
        text: data.text,
        pageCount: data.numpages,
      };
    } catch (error) {
      logger.error('PDF parsing failed, trying AWS Textract...');
      return await this.extractTextFromPDFWithTextract(fileUrl);
    }
  }

  /**
   * Extract text from PDF using AWS Textract (fallback)
   */
  private async extractTextFromPDFWithTextract(
    fileUrl: string
  ): Promise<{ text: string; pageCount: number }> {
    try {
      // Download file
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);

      // Use AWS Textract
      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: buffer,
        },
      });

      const result = await textractClient.send(command);

      // Extract text from blocks
      const text = result.Blocks?.filter((block) => block.BlockType === 'LINE')
        .map((block) => block.Text)
        .join('\n') || '';

      // Estimate page count (Textract doesn't return page count directly)
      const pageCount = Math.ceil((result.Blocks?.length || 0) / 50);

      return { text, pageCount };
    } catch (error) {
      logger.error('AWS Textract failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from image using Tesseract.js
   */
  private async extractTextFromImage(fileUrl: string): Promise<string> {
    try {
      // Use Tesseract.js for OCR
      const result = await Tesseract.recognize(fileUrl, 'eng', {
        logger: (m) => logger.debug(`Tesseract: ${m.status}`),
      });

      return result.data.text;
    } catch (error) {
      logger.error('Tesseract OCR failed, trying AWS Textract...');
      return await this.extractTextFromImageWithTextract(fileUrl);
    }
  }

  /**
   * Extract text from image using AWS Textract (fallback)
   */
  private async extractTextFromImageWithTextract(fileUrl: string): Promise<string> {
    try {
      // Download image
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);

      // Use AWS Textract
      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: buffer,
        },
      });

      const result = await textractClient.send(command);

      // Extract text from blocks
      const text = result.Blocks?.filter((block) => block.BlockType === 'LINE')
        .map((block) => block.Text)
        .join('\n') || '';

      return text;
    } catch (error) {
      logger.error('AWS Textract failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Format extracted text into structured notes using AI
   * TODO: Integrate with AI service
   */
  private async formatNotesWithAI(text: string): Promise<string> {
    // For now, return basic formatting
    // TODO: Call AI service to convert to markdown with proper headings, bullets, etc.

    // Basic formatting
    const lines = text.split('\n');
    const formatted = lines
      .map((line) => {
        line = line.trim();
        if (!line) return '';

        // Detect headings (all caps or numbers)
        if (line.toUpperCase() === line && line.length > 3 && line.length < 100) {
          return `## ${line}\n`;
        }

        // Detect bullet points
        if (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line)) {
          return `${line}\n`;
        }

        return `${line}\n`;
      })
      .join('');

    return formatted;
  }

  /**
   * Generate summary of text using AI
   * TODO: Integrate with AI service
   */
  private async generateSummary(text: string): Promise<string> {
    // For now, return first 500 characters
    // TODO: Call AI service to generate intelligent summary

    if (text.length <= 500) {
      return text;
    }

    // Extract first few sentences
    const sentences = text.split(/[.!?]+/);
    let summary = '';
    for (const sentence of sentences) {
      if (summary.length + sentence.length > 500) break;
      summary += sentence + '. ';
    }

    return summary.trim();
  }

  /**
   * Analyze document structure using AWS Textract
   */
  private async analyzeDocumentStructure(fileUrl: string): Promise<any> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);

      const command = new AnalyzeDocumentCommand({
        Document: {
          Bytes: buffer,
        },
        FeatureTypes: ['TABLES', 'FORMS'],
      });

      const result = await textractClient.send(command);
      return result;
    } catch (error) {
      logger.error('Document structure analysis failed:', error);
      return null;
    }
  }
}

export const notesProcessor = new NotesProcessor();
