import { NextFunction, Request, Response } from 'express';
import { llmService } from '@/modules/llm/llm.service';
import { llmController } from '@/modules/llm/llm.controller';

jest.mock('@/modules/llm/llm.service', () => ({
  llmService: { chat: jest.fn() },
}));

describe('LLMController chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(llmService.chat).mockResolvedValue({
      answer: 'Answer',
      tokensUsed: 10,
      model: 'test-model',
      sources: [],
    });
  });

  it('passes noteId while sourcing userId only from authenticated request context', async () => {
    const req = {
      body: {
        question: 'A valid question?',
        noteId: 'selected-note',
        userId: 'untrusted-body-user',
      },
      user: { id: 'authenticated-user' },
      get: jest.fn().mockReturnValue('request-123'),
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await llmController.chat(req, res, next);

    expect(llmService.chat).toHaveBeenCalledWith({
      question: 'A valid question?',
      userId: 'authenticated-user',
      noteId: 'selected-note',
      idempotencyKey: 'request-123',
    });
    expect(res.status).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
