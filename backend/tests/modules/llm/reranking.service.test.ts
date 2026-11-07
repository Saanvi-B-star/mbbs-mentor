import { cohereClient } from '@/modules/llm/clients/cohere.client';
import {
  RerankingService,
  RerankingUnavailableException,
} from '@/modules/llm/reranking/reranking.service';
import { VectorMatch } from '@/modules/llm/llm.types';
import { logger } from '@/config/logger';

jest.mock('@/modules/llm/clients/cohere.client', () => ({
  cohereClient: { rerank: jest.fn() },
}));
jest.mock('@/config/logger', () => ({
  logger: { error: jest.fn() },
}));

describe('RerankingService', () => {
  const service = new RerankingService();
  const candidateOne: VectorMatch = {
    id: 'candidate-one',
    score: 0.9,
    metadata: { text: 'First study chunk', userId: 'owner-1' },
  };
  const candidateTwo: VectorMatch = {
    id: 'candidate-two',
    score: 0.8,
    metadata: { text: 'Second study chunk', noteId: 'note-2' },
  };

  const rerank = () => {
    if (!cohereClient) throw new Error('Cohere client mock is unavailable.');
    return jest.mocked(cohereClient.rerank);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the query and candidate texts to the configured model and maps indices back to matches', async () => {
    rerank().mockResolvedValue({
      results: [
        { index: 1, relevanceScore: 0.1 },
        { index: 0, relevanceScore: 0.02 },
      ],
    } as never);

    const results = await service.rerank('original user question', [candidateOne, candidateTwo], 5);

    expect(rerank()).toHaveBeenCalledWith({
      model: 'rerank-english-v3.0',
      query: 'original user question',
      documents: ['First study chunk', 'Second study chunk'],
      topN: 2,
    });
    expect(results).toEqual([candidateTwo, candidateOne]);
    expect(results[0]).toBe(candidateTwo);
    expect(results[0]?.metadata).toBe(candidateTwo.metadata);
  });

  it('does not call Cohere for an empty candidate list', async () => {
    await expect(service.rerank('question', [], 5)).resolves.toEqual([]);
    expect(rerank()).not.toHaveBeenCalled();
  });

  it('returns a controlled service-unavailable error when Cohere fails', async () => {
    rerank().mockRejectedValue(new Error('Cohere unavailable'));

    await expect(service.rerank('question', [candidateOne], 5)).rejects.toMatchObject({
      name: 'RerankingUnavailableException',
      statusCode: 503,
      code: 'RERANKING_UNAVAILABLE',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Cohere reranking failed; aborting RAG request:',
      expect.any(Error)
    );
  });

  it('returns a controlled service-unavailable error when Cohere returns no results', async () => {
    rerank().mockResolvedValue({ results: [] } as never);

    await expect(service.rerank('question', [candidateOne], 5)).rejects.toMatchObject({
      name: 'RerankingUnavailableException',
      statusCode: 503,
      code: 'RERANKING_UNAVAILABLE',
    });
  });

  it('returns a controlled service-unavailable error when Cohere omits results', async () => {
    rerank().mockResolvedValue({} as never);

    await expect(service.rerank('question', [candidateOne], 5)).rejects.toMatchObject({
      name: 'RerankingUnavailableException',
      statusCode: 503,
      code: 'RERANKING_UNAVAILABLE',
    });
  });

  it('rejects duplicate result indices rather than returning duplicate chunks', async () => {
    rerank().mockResolvedValue({
      results: [
        { index: 1, relevanceScore: 0.9 },
        { index: 1, relevanceScore: 0.8 },
      ],
    } as never);

    await expect(
      service.rerank('question', [candidateOne, candidateTwo], 2)
    ).rejects.toBeInstanceOf(RerankingUnavailableException);
  });

  it.each([-1, 0.5, 2])('rejects an invalid result index: %s', async (index) => {
    rerank().mockResolvedValue({
      results: [{ index, relevanceScore: 0.9 }],
    } as never);

    await expect(
      service.rerank('question', [candidateOne, candidateTwo], 2)
    ).rejects.toBeInstanceOf(RerankingUnavailableException);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid topN values without calling Cohere: %s',
    async (topN) => {
      await expect(service.rerank('question', [candidateOne], topN)).rejects.toThrow(
        'Reranking topN must be a positive integer.'
      );
      expect(rerank()).not.toHaveBeenCalled();
    }
  );
});
