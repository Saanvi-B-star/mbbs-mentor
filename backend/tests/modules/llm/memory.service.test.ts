import { prisma } from '@/config/database';
import { memoryService } from '@/modules/llm/memory/memory.service';

jest.mock('@/config/database', () => ({
  prisma: {
    llmChatRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));
jest.mock('@/config/logger', () => ({
  logger: { error: jest.fn() },
}));

describe('MemoryService idempotent chat requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a processing claim before chat work begins', async () => {
    jest.mocked(prisma.llmChatRequest.create).mockResolvedValue({
      id: 'request-1',
    } as never);

    const claim = await memoryService.claimChatRequest('user-1', 'key-1', 'hash-1');

    expect(claim).toMatchObject({ status: 'claimed', id: 'request-1' });
    expect(prisma.llmChatRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          idempotencyKey: 'key-1',
          requestHash: 'hash-1',
        }),
      })
    );
    if (claim.status === 'claimed') {
      expect(claim.claimToken).toBeTruthy();
      expect(jest.mocked(prisma.llmChatRequest.create).mock.calls[0]?.[0].data.claimToken).toBe(
        claim.claimToken
      );
    }
  });

  it('returns a completed response instead of claiming the request again', async () => {
    jest.mocked(prisma.llmChatRequest.create).mockRejectedValue(new Error('unique constraint'));
    jest.mocked(prisma.llmChatRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      userId: 'user-1',
      idempotencyKey: 'key-1',
      requestHash: 'hash-1',
      status: 'COMPLETED',
      response: JSON.stringify({
        answer: 'Stored answer',
        tokensUsed: 12,
        model: 'groq',
        sources: [],
      }),
      chatId: 'chat-1',
      claimToken: 'claim-1',
      leaseExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    await expect(memoryService.claimChatRequest('user-1', 'key-1', 'hash-1')).resolves.toEqual({
      status: 'completed',
      response: { answer: 'Stored answer', tokensUsed: 12, model: 'groq', sources: [] },
    });
  });

  it('rejects reuse of a key with a different request hash', async () => {
    jest.mocked(prisma.llmChatRequest.create).mockRejectedValue(new Error('unique constraint'));
    jest.mocked(prisma.llmChatRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      requestHash: 'original-hash',
      status: 'PROCESSING',
      leaseExpiresAt: new Date(Date.now() + 60_000),
    } as never);

    await expect(
      memoryService.claimChatRequest('user-1', 'key-1', 'different-hash')
    ).rejects.toThrow('already used for a different request');
    expect(prisma.llmChatRequest.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a matching request while its lease is active', async () => {
    jest.mocked(prisma.llmChatRequest.create).mockRejectedValue(new Error('unique constraint'));
    jest.mocked(prisma.llmChatRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      requestHash: 'hash-1',
      status: 'PROCESSING',
      claimToken: 'claim-1',
      leaseExpiresAt: new Date(Date.now() + 60_000),
    } as never);

    await expect(memoryService.claimChatRequest('user-1', 'key-1', 'hash-1')).rejects.toThrow(
      'still in progress'
    );
    expect(prisma.llmChatRequest.updateMany).not.toHaveBeenCalled();
  });

  it('fences expired-request takeover with a new claim token', async () => {
    jest.mocked(prisma.llmChatRequest.create).mockRejectedValue(new Error('unique constraint'));
    jest.mocked(prisma.llmChatRequest.findUnique).mockResolvedValue({
      id: 'request-1',
      requestHash: 'hash-1',
      status: 'PROCESSING',
      claimToken: 'old-claim',
      leaseExpiresAt: new Date(Date.now() - 1_000),
    } as never);
    jest.mocked(prisma.llmChatRequest.updateMany).mockResolvedValue({ count: 1 } as never);

    const claim = await memoryService.claimChatRequest('user-1', 'key-1', 'hash-1');

    expect(claim).toMatchObject({ status: 'claimed', id: 'request-1' });
    if (claim.status === 'claimed') {
      expect(claim.claimToken).not.toBe('old-claim');
      expect(prisma.llmChatRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'request-1',
            claimToken: 'old-claim',
            status: 'PROCESSING',
          }),
        })
      );
    }
  });

  it('does not complete a request after its claim has been replaced', async () => {
    const tx = {
      llmChatRequest: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };

    await expect(
      memoryService.completeChatRequestInTransaction(
        tx as never,
        'request-1',
        'stale-claim',
        'chat-1',
        { answer: 'Answer', tokensUsed: 1, model: 'test', sources: [] }
      )
    ).rejects.toThrow('ownership changed');
    expect(tx.llmChatRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-1', status: 'PROCESSING', claimToken: 'stale-claim' },
      })
    );
  });
});
