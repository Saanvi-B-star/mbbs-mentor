import { prisma, logger } from '@/config';
// Duplicate import removed
import {
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { textractClient } from '@/config/aws.config';
import {
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';
import { NoteProcStatus, UserNote } from '@prisma/client';
// Duplicate import removed
import { countWords } from '@/shared/utils';
import { chunkText } from '@/shared/utils/text.utils';
import { llmService } from '@/modules/llm/llm.service';
import { vectorService } from '@/modules/llm/vector/vector.service';
import Tesseract from 'tesseract.js';
// @ts-ignore
import pdfParse from 'pdf-parse';
const parsePdf = pdfParse as any;
import * as path from 'path';
import * as fs from 'fs';

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

      const urlLower = note.fileUrl.toLowerCase();
      const isPdf = urlLower.endsWith('.pdf') || note.fileType === 'pdf' || note.fileType === 'application/pdf';
      const isImage = urlLower.match(/\.(jpg|jpeg|png|webp)$/i) || note.fileType.startsWith('image/');

      if (isPdf && !urlLower.endsWith('.txt')) { // Special case for the broken test note
        const result = await this.extractTextFromPDF(note);
        extractedText = result.text;
        pageCount = result.pageCount;
      } else if (isImage) {
        // Image file
        extractedText = await this.extractTextFromImage(note);
        pageCount = 1;
      } else {
        // Plain text or other types - assume text
        logger.info(`Processing as plain text: ${noteId}`);
        const buffer = await this.downloadFile(note.fileUrl);
        extractedText = buffer.toString('utf-8');
        pageCount = 1;
      }

      // Count words
      const wordCount = countWords(extractedText);

      // 1. Format notes using AI
      logger.info(`Formatting note ${noteId} with AI...`);
      const formattedNotes = await this.formatNotesWithAI(extractedText);

      // 2. Generate summary using AI
      logger.info(`Generating summary for note ${noteId}...`);
      const summary = await this.generateSummary(formattedNotes);

      // 3. Index to Vector Store (Pinecone) for RAG
      // Using formatted notes for better indexing quality
      await this.indexNoteToVectorStore(note, formattedNotes);

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
  private async extractTextFromPDF(note: UserNote): Promise<{ text: string; pageCount: number }> {
    try {
      // Download PDF file
      const buffer = await this.downloadFile(note.fileUrl);

      // Parse PDF
      const data = await parsePdf(buffer);

      return {
        text: data.text,
        pageCount: data.numpages,
      };
    } catch (error) {
      logger.error('PDF parsing failed, trying AWS Textract...', error);
      return await this.extractTextFromPDFWithTextract(note);
    }
  }

  /**
   * Extract text from PDF using AWS Textract (fallback)
   */
  private async extractTextFromPDFWithTextract(
    note: UserNote
  ): Promise<{ text: string; pageCount: number }> {
    try {
      if (!textractClient) throw new Error("AWS Textract is not configured");

      // Download file
      const buffer = await this.downloadFile(note.fileUrl);

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

      // Estimate page count
      const pageCount = Math.ceil((result.Blocks?.length || 0) / 50);

      return { text, pageCount };
    } catch (error) {
      logger.error('AWS Textract failed:', error);
      throw new Error('Failed to extract text from PDF. Please check if your AWS account has Textract subscription enabled.');
    }
  }

  /**
   * Extract text from image using Tesseract.js
   */
  private async extractTextFromImage(note: UserNote): Promise<string> {
    try {
      // For images, we can still use the URL if it's accessible or download it
      // Tesseract.js can work with buffers too
      const buffer = await this.downloadFile(note.fileUrl);

      const result = await Tesseract.recognize(buffer, 'eng', {
        logger: (m) => logger.debug(`Tesseract: ${m.status}`),
      });

      return result.data.text;
    } catch (error) {
      logger.error('Tesseract OCR failed, trying AWS Textract...');
      return await this.extractTextFromImageWithTextract(note);
    }
  }

  /**
   * Extract text from image using AWS Textract (fallback)
   */
  private async extractTextFromImageWithTextract(note: UserNote): Promise<string> {
    try {
      if (!textractClient) {
        throw new Error("AWS Textract is not configured. OCR requires AWS textract when Tesseract fails.");
      }

      // Download file
      const buffer = await this.downloadFile(note.fileUrl);

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
   * Download file from S3 or local storage
   */
  private async downloadFile(fileUrl: string): Promise<Buffer> {
    try {
      if (fileUrl.startsWith('http://localhost') || fileUrl.includes('127.0.0.1')) {
        // Local file
        logger.info(`Downloading file locally: ${fileUrl}`);
        const url = new URL(fileUrl);
        // Correctly identify the relative path within the public directory
        const relativePath = url.pathname.substring(1); 
        const absolutePath = path.join(process.cwd(), 'public', relativePath);
        
        if (!fs.existsSync(absolutePath)) {
          throw new Error(`Local file not found: ${absolutePath}`);
        }
        
        return fs.readFileSync(absolutePath);
      }
      
      // S3 File
      logger.info(`Downloading file from S3: ${fileUrl}`);
      const url = new URL(fileUrl);
      const bucketName = url.hostname.split('.')[0];
      const key = decodeURIComponent(url.pathname.substring(1));

      const { s3Client } = await import('@/config/aws.config');
      if (!s3Client) throw new Error("S3 Client not initialized");

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);
      const byteArray = await response.Body?.transformToByteArray();
      
      if (!byteArray) throw new Error("Empty response body from S3");
      
      return Buffer.from(byteArray);
    } catch (error) {
      logger.error('Failed to download file:', error);
      throw error;
    }
  }

  /**
   * Format extracted text into structured notes using AI
   */
  private async formatNotesWithAI(text: string): Promise<string> {
    try {
      return await llmService.formatNotes(text);
    } catch (error) {
      logger.error('AI formatting failed, falling back to basic formatting:', error);
      
      // Basic formatting fallback
      const lines = text.split('\n');
      return lines
        .map((line) => {
          line = line.trim();
          if (!line) return '';
          if (line.toUpperCase() === line && line.length > 3 && line.length < 100) {
            return `## ${line}\n`;
          }
          if (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line)) {
            return `${line}\n`;
          }
          return `${line}\n`;
        })
        .join('');
    }
  }

  /**
   * Generate summary of text using AI
   */
  private async generateSummary(text: string): Promise<string> {
    try {
      return await llmService.summarize(text);
    } catch (error) {
      logger.error('AI summarization failed, falling back to truncation:', error);
      
      if (text.length <= 500) return text;
      const sentences = text.split(/[.!?]+/);
      let summary = '';
      for (const sentence of sentences) {
        if (summary.length + sentence.length > 500) break;
        summary += sentence + '. ';
      }
      return summary.trim();
    }
  }

  /**
   * Index note content into Pinecone for RAG
   */
  private async indexNoteToVectorStore(note: UserNote, text: string): Promise<void> {
    try {
      logger.info(`Indexing note ${note.id} to vector store...`);

      // Chunk text for embedding
      const chunks = await chunkText(text, 1000, 200);

      // Prepare metadata for each chunk
      const vectorItems = chunks.map((chunk, index) => ({
        id: `note-${note.id}-chunk-${index}`,
        text: chunk,
        metadata: {
          noteId: note.id,
          userId: note.userId,
          title: note.title,
          tags: note.tags.join(', '),
          contentType: 'user_note',
          source: 'note_upload',
        },
      }));

      // Upsert batch to Pinecone
      await vectorService.upsertBatch(vectorItems);

      logger.info(`Successfully indexed note ${note.id} with ${chunks.length} chunks`);
    } catch (error) {
      logger.error(`Failed to index note ${note.id} to Pinecone:`, error);
      // We don't rethrow here to allow the main processing to complete even if indexing fails
    }
  }

  /**
   * Analyze document structure using AWS Textract
   */
  // analyzeDocumentStructure removed as it was unused and had missing dependencies
}

export const notesProcessor = new NotesProcessor();
