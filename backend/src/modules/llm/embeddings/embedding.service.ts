/**
 * Embedding Service
 * Generates text embeddings using OpenAI
 */

import OpenAI from 'openai';
import { config } from '@/config';
import { EmbeddingResult } from '../llm.types';

const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/**
 * OpenAI client for embeddings
 * Uses OpenRouter API with OpenAI-compatible endpoints
 */
const openaiClient = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
});

/**
 * Embedding Service Class
 */
class EmbeddingService {
  /**
   * Generate embedding for text
   * @param text - Text to embed
   * @returns Embedding vector
   */
  async createEmbedding(text: string): Promise<EmbeddingResult> {
    const response = await openaiClient.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
    });

    const firstEmbedding = response.data[0];
    if (!firstEmbedding) {
      throw new Error('No embedding returned from OpenAI');
    }

    return {
      embedding: firstEmbedding.embedding,
      tokensUsed: response.usage.total_tokens,
    };
  }

  /**
   * Generate embeddings for multiple texts
   * @param texts - Array of texts to embed
   * @returns Array of embeddings
   */
  async createBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const response = await openaiClient.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map((t) => t.trim()),
    });

    return response.data.map((item) => ({
      embedding: item.embedding,
      tokensUsed: Math.floor(response.usage.total_tokens / texts.length),
    }));
  }
}

export const embeddingService = new EmbeddingService();
