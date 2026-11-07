/**
 * Vector Service
 * Handles Pinecone vector operations
 */

import { getPineconeIndex } from '../clients/pinecone.client';
import { embeddingService } from '../embeddings/embedding.service';
import { logger } from '@/config/logger';
import { VectorUpsertParams, VectorMatch, VectorSearchResult, VectorMetadata } from '../llm.types';
import type { RecordMetadata } from '@pinecone-database/pinecone';

const DEFAULT_TOP_K = 5;
const SHARED_NODE_TYPES = ['subject', 'topic', 'material', 'question'];

const parseMetadata = (metadata: unknown): VectorMetadata | null => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const raw = metadata as Record<string, unknown>;
  if (typeof raw.text !== 'string' || !raw.text.trim()) {
    return null;
  }

  const parsed: VectorMetadata = { text: raw.text };
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'text') continue;
    if (
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    ) {
      parsed[key] = value as string | number | boolean | string[];
    }
  }
  return parsed;
};

/**
 * Vector Service Class
 */
export class VectorService {
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
  async search(
    query: string,
    userId: string,
    topK: number = DEFAULT_TOP_K,
    noteId?: string
  ): Promise<VectorSearchResult> {
    if (!userId.trim()) {
      throw new Error('An authenticated user ID is required for vector search.');
    }
    if (!query.trim()) {
      throw new Error('A non-empty query is required for vector search.');
    }
    if (!Number.isInteger(topK) || topK < 1) {
      throw new Error('Vector search topK must be a positive integer.');
    }
    if (noteId !== undefined && !noteId.trim()) {
      throw new Error('A non-empty note ID is required for note-scoped vector search.');
    }

    try {
      const index = getPineconeIndex();
      const { embedding } = await embeddingService.createEmbedding(query, 'search_query');
      const eligibilityFilter = {
        $or: [
          { userId: { $eq: userId } },
          { contentType: { $eq: 'user_note' }, isPublic: { $eq: true } },
          { nodeType: { $in: SHARED_NODE_TYPES } },
          { contentType: { $eq: 'study_material' } },
        ],
      };
      const results = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
        filter: noteId
          ? {
              $and: [{ noteId: { $eq: noteId } }, eligibilityFilter],
            }
          : eligibilityFilter,
      });

      const pineconeMatches = results.matches || [];
      const matches: VectorMatch[] = [];
      for (const match of pineconeMatches) {
        const metadata = parseMetadata(match.metadata);
        if (!metadata || typeof match.score !== 'number' || !Number.isFinite(match.score)) {
          logger.warn(`Ignoring Pinecone match with invalid metadata or score (id: ${match.id}).`);
          continue;
        }
        matches.push({ id: match.id, score: match.score, metadata });
      }

      logger.info('RAG Pinecone retrieval diagnostics', {
        event: 'rag_pinecone_retrieval',
        pineconeMatchCount: pineconeMatches.length,
        matches: pineconeMatches.map((match) => {
          const metadata =
            match.metadata && typeof match.metadata === 'object' && !Array.isArray(match.metadata)
              ? (match.metadata as Record<string, unknown>)
              : undefined;
          const isUserNote =
            metadata?.contentType === 'user_note' ||
            typeof metadata?.userId === 'string' ||
            typeof metadata?.noteId === 'string';

          return {
            score:
              typeof match.score === 'number' && Number.isFinite(match.score) ? match.score : null,
            ...(isUserNote && typeof metadata?.noteId === 'string'
              ? { noteId: metadata.noteId }
              : {}),
            ...(isUserNote &&
            typeof metadata?.chunkIndex === 'number' &&
            Number.isFinite(metadata.chunkIndex)
              ? { chunkIndex: metadata.chunkIndex }
              : {}),
          };
        }),
        metadataValidatedMatchCount: matches.length,
      });

      return { matches, query };
    } catch (error) {
      logger.error('Pinecone vector search failed:', error);
      throw error;
    }
  }

  async updateNoteVisibility(noteId: string, userId: string, isPublic: boolean): Promise<void> {
    try {
      const index = getPineconeIndex();
      await index.update({
        filter: { noteId: { $eq: noteId } },
        metadata: { userId, contentType: 'user_note', isPublic },
      });
    } catch (error) {
      logger.error(`Failed to update Pinecone visibility metadata for note ${noteId}:`, error);
      throw error;
    }
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
