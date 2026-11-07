import { prisma } from '@/config';
import { TokenRepository } from '@/modules/token/token.repository';

jest.mock('@/config', () => ({
  prisma: { $transaction: jest.fn() },
}));

describe('TokenRepository.createTransactionOnce', () => {
  const repository = new TokenRepository();
  const tx = {
    $queryRaw: jest.fn(),
    tokenTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(prisma.$transaction)
      .mockImplementation(((callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx)) as never);
    tx.$queryRaw.mockResolvedValue([]);
    tx.tokenTransaction.findFirst.mockResolvedValue(null);
    tx.user.findUnique.mockResolvedValue({
      currentTokenBalance: 5,
      totalTokensEarned: 10,
      totalTokensSpent: 5,
    });
    tx.tokenTransaction.create.mockResolvedValue({
      id: 'transaction-1',
      balanceAfter: 4,
    });
    tx.user.update.mockResolvedValue({});
  });

  it('returns an existing transaction on retry without deducting again', async () => {
    const existing = { id: 'existing-transaction', balanceAfter: 4 };
    tx.tokenTransaction.findFirst.mockResolvedValue(existing);

    const result = await repository.createTransactionOnce({
      userId: 'user-1',
      transactionType: 'SPENT',
      amount: 1,
      feature: 'ai_chat',
      referenceId: 'ai_chat:user-1:request-1',
    });

    expect(result).toEqual({ transaction: existing, newBalance: 4 });
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.tokenTransaction.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('locks the user balance before creating a first deduction', async () => {
    const result = await repository.createTransactionOnce({
      userId: 'user-1',
      transactionType: 'SPENT',
      amount: 1,
      feature: 'ai_chat',
      referenceId: 'ai_chat:user-1:request-1',
    });

    expect(result).toEqual({
      transaction: { id: 'transaction-1', balanceAfter: 4 },
      newBalance: 4,
    });
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.tokenTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referenceId: 'ai_chat:user-1:request-1',
          transactionType: 'SPENT',
        }),
      })
    );
    expect(tx.user.update).toHaveBeenCalled();
  });
});
