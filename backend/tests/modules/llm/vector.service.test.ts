import { getPineconeIndex } from '@/modules/llm/clients/pinecone.client';
import { embeddingService } from '@/modules/llm/embeddings/embedding.service';
import { VectorService } from '@/modules/llm/vector/vector.service';
import { logger } from '@/config/logger';

jest.mock('@/modules/llm/clients/pinecone.client', () => ({
  getPineconeIndex: jest.fn(),
}));
jest.mock('@/modules/llm/embeddings/embedding.service', () => ({
  embeddingService: { createEmbedding: jest.fn() },
}));
jest.mock('@/config/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

describe('VectorService', () => {
  const service = new VectorService();
  const query = jest.fn();
  const update = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getPineconeIndex).mockReturnValue({ query, update } as never);
    jest.mocked(embeddingService.createEmbedding).mockResolvedValue({
      embedding: [0.1, 0.2],
      tokensUsed: 0,
    });
  });

  it('filters for the owner, explicitly public notes, and shared indexed content', async () => {
    query.mockResolvedValue({
      matches: [{ id: 'public-1', score: 0.9, metadata: { text: 'Public text', isPublic: true } }],
    });

    await service.search('question', 'owner-1', 5);

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 5,
        filter: {
          $or: [
            { userId: { $eq: 'owner-1' } },
            { contentType: { $eq: 'user_note' }, isPublic: { $eq: true } },
            { nodeType: { $in: ['subject', 'topic', 'material', 'question'] } },
            { contentType: { $eq: 'study_material' } },
          ],
        },
      })
    );
  });

  it('combines selected-note filtering with the existing eligibility filter', async () => {
    query.mockResolvedValue({
      matches: [
        { id: 'note-vector', score: 0.8, metadata: { text: 'Note text', noteId: 'note-1' } },
      ],
    });

    const result = await service.search('question', 'owner-1', 5, 'note-1');

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 5,
        filter: {
          $and: [
            { noteId: { $eq: 'note-1' } },
            {
              $or: [
                { userId: { $eq: 'owner-1' } },
                { contentType: { $eq: 'user_note' }, isPublic: { $eq: true } },
                { nodeType: { $in: ['subject', 'topic', 'material', 'question'] } },
                { contentType: { $eq: 'study_material' } },
              ],
            },
          ],
        },
      })
    );
    expect(result.matches.map((match) => match.metadata.noteId)).toEqual(['note-1']);
  });

  it('rejects a missing user ID without embedding or querying Pinecone', async () => {
    await expect(service.search('question', '')).rejects.toThrow('authenticated user ID');
    expect(embeddingService.createEmbedding).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it('drops malformed older Pinecone metadata while preserving valid records', async () => {
    query.mockResolvedValue({
      matches: [
        { id: 'valid', score: 0.8, metadata: { text: 'usable', documentName: 'notes.pdf' } },
        { id: 'missing-text', score: 0.9, metadata: { documentName: 'unknown.pdf' } },
        { id: 'invalid-score', score: Number.NaN, metadata: { text: 'invalid score' } },
      ],
    });

    const result = await service.search('question', 'owner-1');

    expect(result.matches).toEqual([
      {
        id: 'valid',
        score: 0.8,
        metadata: { text: 'usable', documentName: 'notes.pdf' },
      },
    ]);
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it('logs and propagates embedding and Pinecone failures', async () => {
    const embeddingError = new Error('Cohere unavailable');
    jest.mocked(embeddingService.createEmbedding).mockRejectedValueOnce(embeddingError);
    await expect(service.search('question', 'owner-1')).rejects.toBe(embeddingError);
    expect(logger.error).toHaveBeenCalledWith('Pinecone vector search failed:', embeddingError);
    expect(query).not.toHaveBeenCalled();

    const pineconeError = new Error('Pinecone unavailable');
    query.mockRejectedValueOnce(pineconeError);
    await expect(service.search('question', 'owner-1')).rejects.toBe(pineconeError);
    expect(logger.error).toHaveBeenCalledWith('Pinecone vector search failed:', pineconeError);
  });

  it('updates visibility metadata for all chunks belonging to a note', async () => {
    update.mockResolvedValue(undefined);

    await service.updateNoteVisibility('note-1', 'owner-1', false);

    expect(update).toHaveBeenCalledWith({
      filter: { noteId: { $eq: 'note-1' } },
      metadata: { userId: 'owner-1', contentType: 'user_note', isPublic: false },
    });
  });
});
