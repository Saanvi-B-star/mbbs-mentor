import { chatSchema } from '@/modules/llm/llm.validation';

describe('chatSchema', () => {
  it('accepts chat requests with or without a selected note ID', () => {
    expect(chatSchema.safeParse({ body: { question: 'Valid question?' } }).success).toBe(true);
    expect(
      chatSchema.safeParse({
        body: { question: 'Valid question?', noteId: 'selected-note' },
      }).success
    ).toBe(true);
  });

  it('rejects empty or oversized selected note IDs', () => {
    expect(
      chatSchema.safeParse({ body: { question: 'Valid question?', noteId: '' } }).success
    ).toBe(false);
    expect(
      chatSchema.safeParse({
        body: { question: 'Valid question?', noteId: 'n'.repeat(201) },
      }).success
    ).toBe(false);
  });

  it('does not accept userId from the request body', () => {
    const result = chatSchema.safeParse({
      body: { question: 'Valid question?', userId: 'untrusted-user' },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).not.toHaveProperty('userId');
    }
  });
});
