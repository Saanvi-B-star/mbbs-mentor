/**
 * Vector Service
 * Handles Pinecone vector operations
 */

import { getPineconeIndex } from '../clients/pinecone.client';
import { embeddingService } from '../embeddings/embedding.service';
import {
  VectorUpsertParams,
  VectorMatch,
  VectorSearchResult,
  VectorMetadata,
} from '../llm.types';
import type { RecordMetadata } from '@pinecone-database/pinecone';

const DEFAULT_TOP_K = 5;

/**
 * Vector Service Class
 */
class VectorService {
  /**
   * Upsert a vector into Pinecone
   * @param params - Vector data with text and metadata
   */
  async upsert(params: VectorUpsertParams): Promise<void> {
    const { id, text, metadata = {} } = params;
    const index = getPineconeIndex();

    // Generate embedding
    const { embedding } = await embeddingService.createEmbedding(text);

    // Upsert to Pinecone
    await index.upsert({
      records: [
        {
          id,
          values: embedding,
          metadata: {
            text,
            ...metadata,
          } as RecordMetadata,
        },
      ],
    });
  }

  /**
   * Upsert multiple vectors
   * @param items - Array of vector data
   */
  async upsertBatch(items: VectorUpsertParams[]): Promise<void> {
    const index = getPineconeIndex();

    // Generate embeddings in batch
    const texts = items.map((item) => item.text);
    const embeddings = await embeddingService.createBatchEmbeddings(texts);

    // Prepare vectors
    const vectors = items.map((item, i) => {
      const embeddingResult = embeddings[i];
      if (!embeddingResult) {
        throw new Error(`No embedding found for item at index ${i}`);
      }
      return {
        id: item.id,
        values: embeddingResult.embedding,
        metadata: {
          text: item.text,
          ...item.metadata,
        } as RecordMetadata,
      };
    });

    // Upsert in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE);
      await index.upsert({ records: batch });
    }
  }

  /**
   * Search for similar vectors
   * @param query - Search query text
   * @param topK - Number of results to return
   * @returns Matching vectors with scores
   */
  async search(query: string, topK: number = DEFAULT_TOP_K): Promise<VectorSearchResult> {
    const index = getPineconeIndex();

    // Generate query embedding
    const { embedding } = await embeddingService.createEmbedding(query, 'search_query');

    // Query Pinecone
    const results = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    // Transform results
    const matches: VectorMatch[] = (results.matches || []).map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as VectorMetadata,
    }));

    return {
      matches,
      query,
    };
  }

  /**
   * Delete vectors by IDs
   * @param ids - Vector IDs to delete
   */
  async deleteByIds(ids: string[]): Promise<void> {
    const index = getPineconeIndex();
    await index.deleteMany(ids);
  }

  /**
   * Delete all vectors (use with caution)
   */
  async deleteAll(): Promise<void> {
    const index = getPineconeIndex();
    await index.deleteAll();
  }
}

export const vectorService = new VectorService();
