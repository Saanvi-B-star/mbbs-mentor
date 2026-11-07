/**
 * Embedding Service
 * Generates text embeddings using Cohere
 */

import { cohereClient } from '../clients/cohere.client';
import { logger } from '@/config/logger';
import { EmbeddingResult } from '../llm.types';

const EMBEDDING_MODEL = 'embed-english-v3.0';

/**
 * Embedding Service Class
 */
class EmbeddingService {
  /**
   * Generate embedding for text
   * @param text - Text to embed
   * @param inputType - Cohere input type ('search_document' for indexing, 'search_query' for matching)
   * @returns Embedding vector
   */
  async createEmbedding(
    text: string,
    inputType:
      | 'search_document'
      | 'search_query'
      | 'classification'
      | 'clustering' = 'search_document'
  ): Promise<EmbeddingResult> {
    if (!cohereClient) {
      const error = new Error('Cohere client not initialized. Check COHERE_API_KEY.');
      logger.error('Cohere embedding generation failed:', error);
      throw error;
    }

    if (!text.trim()) {
      throw new Error('Cannot generate an embedding for empty text.');
    }

    try {
      const response = await cohereClient.embed({
        texts: [text.trim()],
        model: EMBEDDING_MODEL,
        inputType,
      });

      const embeddings = (response as { embeddings?: unknown }).embeddings;
      const embedding = Array.isArray(embeddings) ? embeddings[0] : undefined;
      if (
        !Array.isArray(embedding) ||
        embedding.length === 0 ||
        !embedding.every((value) => typeof value === 'number' && Number.isFinite(value))
      ) {
        throw new Error('Cohere returned an invalid embedding.');
      }

      return { embedding, tokensUsed: 0 };
    } catch (error) {
      logger.error('Cohere embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param texts - Array of texts to embed
   * @param inputType - Cohere input type
   * @returns Array of embeddings
   */
  async createBatchEmbeddings(
    texts: string[],
    inputType:
      | 'search_document'
      | 'search_query'
      | 'classification'
      | 'clustering' = 'search_document'
  ): Promise<EmbeddingResult[]> {
    if (!cohereClient) {
      const error = new Error('Cohere client not initialized. Check COHERE_API_KEY.');
      logger.error('Cohere batch embedding generation failed:', error);
      throw error;
    }

    if (texts.length === 0) return [];

    if (texts.some((text) => !text.trim())) {
      throw new Error('Cannot generate embeddings for empty text.');
    }

    try {
      const response = await cohereClient.embed({
        texts: texts.map((text) => text.trim()),
        model: EMBEDDING_MODEL,
        inputType,
      });

      const embeddings = (response as { embeddings?: unknown }).embeddings;
      if (
        !Array.isArray(embeddings) ||
        embeddings.length !== texts.length ||
        !embeddings.every(
          (embedding) =>
            Array.isArray(embedding) &&
            embedding.length > 0 &&
            embedding.every((value) => typeof value === 'number' && Number.isFinite(value))
        )
      ) {
        throw new Error('Cohere returned invalid batch embeddings.');
      }

      return embeddings.map((embedding) => ({
        embedding: embedding as number[],
        tokensUsed: 0,
      }));
    } catch (error) {
      logger.error('Cohere batch embedding generation failed:', error);
      throw error;
    }
  }
}

export { EmbeddingService };
export const embeddingService = new EmbeddingService();
