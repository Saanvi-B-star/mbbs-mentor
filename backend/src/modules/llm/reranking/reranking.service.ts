import { cohereClient } from '../clients/cohere.client';
import { logger } from '@/config/logger';
import { HTTP_STATUS } from '@/shared/constants';
import { BaseException } from '@/shared/exceptions';
import { VectorMatch } from '../llm.types';

const RERANK_MODEL = 'rerank-english-v3.0';

export class RerankingUnavailableException extends BaseException {
  statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
  status = 'error';

  constructor() {
    super('The relevance reranking service is unavailable.', 'RERANKING_UNAVAILABLE');
  }
}

export class RerankingService {
  async rerank(query: string, matches: VectorMatch[], topN: number): Promise<VectorMatch[]> {
    if (matches.length === 0) return [];
    if (!Number.isInteger(topN) || topN < 1) {
      throw new Error('Reranking topN must be a positive integer.');
    }

    if (!cohereClient) {
      const error = new Error('Cohere client not initialized. Check COHERE_API_KEY.');
      logger.error('Cohere reranking failed; aborting RAG request:', error);
      throw new RerankingUnavailableException();
    }

    try {
      const response = await cohereClient.rerank({
        model: RERANK_MODEL,
        query,
        documents: matches.map((match) => match.metadata.text),
        topN: Math.min(topN, matches.length),
      });
      if (!Array.isArray(response.results) || response.results.length === 0) {
        throw new Error('Cohere returned no reranking results.');
      }

      const seenIndexes = new Set<number>();
      return response.results.map((result) => {
        const index = result?.index;
        if (
          typeof index !== 'number' ||
          !Number.isInteger(index) ||
          index < 0 ||
          index >= matches.length ||
          seenIndexes.has(index)
        ) {
          throw new Error('Cohere returned an invalid reranking result index.');
        }
        seenIndexes.add(index);
        const match = matches[index];
        if (!match) {
          throw new Error('Cohere returned an invalid reranking result index.');
        }
        return match;
      });
    } catch (error) {
      logger.error('Cohere reranking failed; aborting RAG request:', error);
      throw new RerankingUnavailableException();
    }
  }
}

export const rerankingService = new RerankingService();
