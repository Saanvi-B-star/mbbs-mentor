/**
 * Embedding Service
 * Generates text embeddings using Cohere
 */

import { cohereClient } from '../clients/cohere.client';
import { logger } from '@/config';
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
    inputType: 'search_document' | 'search_query' | 'classification' | 'clustering' = 'search_document'
  ): Promise<EmbeddingResult> {
    if (!cohereClient) {
      throw new Error('Cohere client not initialized. Check COHERE_API_KEY.');
    }

    const response = await cohereClient.embed({
      texts: [text.trim()],
      model: EMBEDDING_MODEL,
      inputType: inputType,
    });

    // Check for embeddings in the response
    // Cohere v3 returns embeddings as a property on the response
    const embeddings = (response as any).embeddings;
    
    if (!embeddings || (Array.isArray(embeddings) && embeddings.length === 0)) {
      throw new Error('No embedding returned from Cohere');
    }

    // Convert to number[] if it's float embeddings
    const embedding = Array.isArray(embeddings[0]) ? embeddings[0] : [];

    return {
      embedding,
      tokensUsed: 0, // Cohere SDK doesn't return tokens in a standard way here
    };
  }

  /**
   * Generate embeddings for multiple texts
   * @param texts - Array of texts to embed
   * @param inputType - Cohere input type
   * @returns Array of embeddings
   */
  async createBatchEmbeddings(
    texts: string[],
    inputType: 'search_document' | 'search_query' | 'classification' | 'clustering' = 'search_document'
  ): Promise<EmbeddingResult[]> {
    if (!cohereClient) {
      throw new Error('Cohere client not initialized. Check COHERE_API_KEY.');
    }

    if (texts.length === 0) return [];

    const response = await cohereClient.embed({
      texts: texts.map((t) => t.trim()),
      model: EMBEDDING_MODEL,
      inputType: inputType,
    });

    const embeddings = (response as any).embeddings;

    if (!Array.isArray(embeddings)) {
      throw new Error('Invalid response from Cohere embeddings');
    }

    return embeddings.map((emb: any) => ({
      embedding: Array.isArray(emb) ? emb : [],
      tokensUsed: 0,
    }));
  }
}

export const embeddingService = new EmbeddingService();
