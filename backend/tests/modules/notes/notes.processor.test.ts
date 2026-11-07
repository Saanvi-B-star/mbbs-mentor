import { buildNoteVectorItems } from '@/modules/notes/notes.processor';

jest.mock('@/config', () => ({
  prisma: {},
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/config/aws.config', () => ({ textractClient: null }));
jest.mock('@/modules/llm/llm.service', () => ({ llmService: {} }));
jest.mock('@/modules/llm/vector/vector.service', () => ({ vectorService: {} }));
jest.mock('@/shared/utils', () => ({ countWords: jest.fn() }));

describe('buildNoteVectorItems', () => {
  it('stores owner, visibility, document, topic, and stable chunk metadata without inventing pages', () => {
    const note = {
      id: 'note-1',
      userId: 'owner-1',
      isPublic: false,
      title: 'Cardiology revision',
      originalFileName: 'cardiology.pdf',
      topicId: 'topic-1',
      tags: ['heart'],
      topic: {
        name: 'Cardiac cycle',
        subject: { name: 'Physiology' },
      },
    };

    const items = buildNoteVectorItems(note, ['Chunk text']);

    expect(items).toEqual([
      {
        id: 'note-note-1-chunk-0',
        text: 'Chunk text',
        metadata: {
          noteId: 'note-1',
          userId: 'owner-1',
          isPublic: false,
          title: 'Cardiology revision',
          documentName: 'cardiology.pdf',
          originalFileName: 'cardiology.pdf',
          sourceId: 'note-note-1-chunk-0',
          chunkIndex: 0,
          topicId: 'topic-1',
          topicName: 'Cardiac cycle',
          subjectName: 'Physiology',
          tags: 'heart',
          contentType: 'user_note',
          source: 'note_upload',
        },
      },
    ]);
    expect(items[0]?.metadata).not.toHaveProperty('pageNumber');
  });
});
