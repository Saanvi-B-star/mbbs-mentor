import { config, logger, prisma } from '@/config';
import { groqClient } from '@/modules/llm/clients/groq.client';
import { openrouterClient } from '@/modules/llm/clients/openrouter.client';
import { memoryService } from '@/modules/llm/memory/memory.service';
import { tokenService } from '@/modules/token/token.service';
import { vectorService } from '@/modules/llm/vector/vector.service';
import { rerankingService } from '@/modules/llm/reranking/reranking.service';
import { LLMService } from '@/modules/llm/llm.service';
import { LLMCompletionParams, LLMCompletionResult, VectorMatch } from '@/modules/llm/llm.types';
import { NoteProcStatus } from '@prisma/client';

jest.mock('@/config', () => ({
  config: {
    isDevelopment: true,
    rag: { topK: 20, rerankTopK: 5 },
    groq: { defaultModel: 'llama-test' },
  },
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  prisma: {
    userNote: { findMany: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(async (callback) => callback({})),
  },
}));
jest.mock('@/modules/llm/vector/vector.service', () => ({
  vectorService: { search: jest.fn() },
}));
jest.mock('@/modules/llm/reranking/reranking.service', () => ({
  rerankingService: { rerank: jest.fn() },
}));
jest.mock('@/modules/llm/memory/memory.service', () => ({
  memoryService: {
    saveChat: jest.fn(),
    saveChatInTransaction: jest.fn(),
    claimChatRequest: jest.fn(),
    completeChatRequestInTransaction: jest.fn(),
    releaseChatRequest: jest.fn(),
    getChatHistory: jest.fn(),
    deleteChatHistory: jest.fn(),
  },
}));
jest.mock('@/modules/token/token.service', () => ({
  tokenService: { deductTokensOnce: jest.fn(), deductTokensOnceInTransaction: jest.fn() },
}));
jest.mock('@/modules/llm/clients/groq.client', () => ({
  groqClient: { chat: { completions: { create: jest.fn() } } },
}));
jest.mock('@/modules/llm/clients/openrouter.client', () => ({
  openrouterClient: { chat: { completions: { create: jest.fn() } } },
}));

const noteMatch = (
  id: string,
  userId: string,
  noteId: string,
  score = 0.9,
  extra: Partial<VectorMatch['metadata']> = {}
): VectorMatch => ({
  id,
  score,
  metadata: {
    text: `Text for ${id}`,
    contentType: 'user_note',
    userId,
    noteId,
    ...extra,
  },
});

const providerResponse = (
  content: string,
  model = 'groq-test',
  finishReason: string | null = 'stop'
) =>
  ({
    choices: [{ message: { content }, finish_reason: finishReason }],
    model,
    usage: { total_tokens: 10 },
  }) as never;

const generatedResponse = (
  noteClaims: Array<{ text: string; citations: string[] }>,
  generalKnowledge: string[] = [],
  model = 'groq-test'
) => providerResponse(JSON.stringify({ noteClaims, generalKnowledge }), model);

const groqCreate = () => {
  if (!groqClient) throw new Error('Groq test mock is unavailable.');
  return jest.mocked(groqClient.chat.completions.create);
};

describe('LLMService grounded chat', () => {
  const service = new LLMService();
  const getCompletion = (
    params: LLMCompletionParams,
    expectJson = false
  ): Promise<LLMCompletionResult> =>
    (
      service as unknown as {
        getCompletion: (
          completionParams: LLMCompletionParams,
          completionExpectsJson?: boolean
        ) => Promise<LLMCompletionResult>;
      }
    ).getCompletion(params, expectJson);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(config, 'isDevelopment', { value: true, configurable: true });
    process.env.NODE_ENV = 'test';
    delete process.env.RAG_LOCAL_SKIP_CITATION_VERIFICATION;
    delete process.env.RAG_LOCAL_ASPIRIN_TRACE;
    delete process.env.RAG_LOCAL_ASPIRIN_TRACE_USER_ID;
    jest.mocked(vectorService.search).mockResolvedValue({ query: 'question', matches: [] });
    jest
      .mocked(rerankingService.rerank)
      .mockImplementation(async (_question, matches, topN) => matches.slice(0, topN));
    jest.mocked(prisma.userNote.findMany).mockResolvedValue([]);
    jest.mocked(memoryService.saveChat).mockResolvedValue({
      id: 'chat-1',
      userId: 'user-1',
      question: 'question',
      response: 'answer',
      createdAt: new Date(),
    });
    jest.mocked(memoryService.saveChatInTransaction).mockResolvedValue({
      id: 'chat-1',
      userId: 'user-1',
      question: 'question',
      response: 'answer',
      createdAt: new Date(),
    });
    jest.mocked(memoryService.claimChatRequest).mockResolvedValue({
      status: 'claimed',
      id: 'request-1',
      claimToken: 'claim-token-1',
    });
    jest.mocked(memoryService.completeChatRequestInTransaction).mockResolvedValue(undefined);
    jest.mocked(memoryService.releaseChatRequest).mockResolvedValue(undefined);
    jest.mocked(tokenService.deductTokensOnce).mockResolvedValue({} as never);
    jest.mocked(tokenService.deductTokensOnceInTransaction).mockResolvedValue({} as never);
    groqCreate().mockImplementation((async (params: { messages: Array<{ content: unknown }> }) => {
      if (String(params.messages[0]?.content).includes('strict evidence verifier')) {
        const request = JSON.parse(String(params.messages[1]?.content)) as {
          claims: Array<{ claimIndex: number; citationId: string; evidence: string }>;
        };
        return providerResponse(
          JSON.stringify({
            decisions: request.claims.map((claim) => ({
              claimIndex: claim.claimIndex,
              citationId: claim.citationId,
              supported: true,
              supportingQuote: claim.evidence,
            })),
          })
        );
      }
      return generatedResponse([{ text: 'Answer', citations: ['S1'] }]);
    }) as never);
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValue(
        generatedResponse([{ text: 'OpenRouter answer', citations: ['S1'] }], [], 'openrouter-test')
      );
  });

  it('requires an authenticated user and never performs unrestricted retrieval', async () => {
    await expect(service.chat({ question: 'question', userId: '' })).rejects.toThrow(
      'authenticated user ID'
    );
    expect(vectorService.search).not.toHaveBeenCalled();
  });

  it('returns normal Groq completion content, finish reason, usage, and model', async () => {
    groqCreate().mockResolvedValueOnce(
      providerResponse('{"noteClaims":[],"generalKnowledge":[]}', 'groq-model', 'stop')
    );

    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] })
    ).resolves.toEqual({
      content: '{"noteClaims":[],"generalKnowledge":[]}',
      finishReason: 'stop',
      tokensUsed: 10,
      model: 'groq-model',
    });
    expect(openrouterClient.chat.completions.create).not.toHaveBeenCalled();
  });

  it('falls back to OpenRouter when Groq terminates at the output-token limit', async () => {
    groqCreate().mockResolvedValueOnce(providerResponse('{"noteClaims":[', 'groq-model', 'length'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValueOnce(
        providerResponse('{"noteClaims":[],"generalKnowledge":[]}', 'openrouter-model', 'stop')
      );

    const result = await getCompletion({
      messages: [{ role: 'user', content: 'question' }],
      model: 'openai/test-model',
    });

    expect(result).toEqual({
      content: '{"noteClaims":[],"generalKnowledge":[]}',
      finishReason: 'stop',
      tokensUsed: 10,
      model: 'openrouter-model',
    });
    expect(openrouterClient.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'LLM completion truncated by output-token limit; falling back to OpenRouter.',
      { provider: 'Groq', model: 'groq-model', finishReason: 'length' }
    );
  });

  it('retries truncated local answer generation once with concise JSON instructions', async () => {
    process.env.NODE_ENV = 'development';
    process.env.RAG_LOCAL_SKIP_CITATION_VERIFICATION = '1';
    const match = noteMatch('concise-source', 'user-1', 'note-1', 0.9, {
      text: 'Ventricular filling occurs during diastole.',
    });
    jest.mocked(vectorService.search).mockResolvedValue({ query: 'question', matches: [match] });
    groqCreate()
      .mockResolvedValueOnce(providerResponse('{"noteClaims":[', 'groq-model', 'length'))
      .mockResolvedValueOnce(
        generatedResponse(
          [{ text: 'Ventricular filling occurs during diastole.', citations: ['S1'] }],
          [],
          'groq-model'
        )
      );

    const result = await service.chat({
      question: 'Explain ventricular filling.',
      userId: 'user-1',
    });

    expect(result.answer).toContain('**UNVERIFIED LOCAL TESTING OUTPUT — CITATIONS NOT VERIFIED**');
    expect(result.answer).toContain('Ventricular filling occurs during diastole. [S1]');
    expect(groqCreate()).toHaveBeenCalledTimes(2);
    expect(openrouterClient.chat.completions.create).not.toHaveBeenCalled();
    expect(String(groqCreate().mock.calls[1]?.[0].messages[1]?.content)).toContain(
      'Return valid JSON only, with at most 5 concise note claims'
    );
    expect(
      groqCreate().mock.calls.some((call) =>
        String(call[0].messages[0]?.content).includes('strict evidence verifier')
      )
    ).toBe(false);
  });

  it('returns a controlled truncation error after one incomplete local retry', async () => {
    process.env.NODE_ENV = 'development';
    process.env.RAG_LOCAL_SKIP_CITATION_VERIFICATION = '1';
    groqCreate()
      .mockResolvedValueOnce(providerResponse('{"noteClaims":[', 'groq-model', 'length'))
      .mockResolvedValueOnce(providerResponse('{"noteClaims":[', 'groq-model', 'length'));

    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] }, true)
    ).rejects.toMatchObject({
      name: 'LLMCompletionTruncatedException',
      code: 'LLM_COMPLETION_TRUNCATED',
    });
    expect(groqCreate()).toHaveBeenCalledTimes(2);
    expect(openrouterClient.chat.completions.create).not.toHaveBeenCalled();
  });

  it('returns a controlled invalid-response error after one malformed local retry', async () => {
    process.env.NODE_ENV = 'development';
    process.env.RAG_LOCAL_SKIP_CITATION_VERIFICATION = '1';
    groqCreate()
      .mockResolvedValueOnce(providerResponse('{"noteClaims":', 'groq-model', 'stop'))
      .mockResolvedValueOnce(providerResponse('{"noteClaims":', 'groq-model', 'stop'));

    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] }, true)
    ).rejects.toMatchObject({
      name: 'LLMStructuredResponseException',
      code: 'LLM_RESPONSE_INVALID',
    });
    expect(groqCreate()).toHaveBeenCalledTimes(2);
    expect(openrouterClient.chat.completions.create).not.toHaveBeenCalled();
  });

  it('returns normal OpenRouter completion content and finish reason after Groq fails', async () => {
    groqCreate().mockRejectedValueOnce(new Error('Groq down'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValueOnce(providerResponse('complete response', 'openrouter-model', 'stop'));

    await expect(
      getCompletion({
        messages: [{ role: 'user', content: 'question' }],
        model: 'openai/test-model',
      })
    ).resolves.toEqual({
      content: 'complete response',
      finishReason: 'stop',
      tokensUsed: 10,
      model: 'openrouter-model',
    });
  });

  it('throws a controlled error when OpenRouter terminates at the output-token limit', async () => {
    groqCreate().mockRejectedValueOnce(new Error('Groq down'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValueOnce(providerResponse('{"noteClaims":[', 'openrouter-model', 'length'));

    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] })
    ).rejects.toMatchObject({
      name: 'LLMCompletionTruncatedException',
      statusCode: 500,
      code: 'LLM_COMPLETION_TRUNCATED',
      message: 'LLM generation was truncated by the output-token limit.',
    });
    expect(logger.warn).toHaveBeenCalledWith('LLM completion truncated by output-token limit.', {
      provider: 'OpenRouter',
      model: 'openrouter-model',
      finishReason: 'length',
    });
  });

  it('preserves fallback for Groq errors and empty-response handling', async () => {
    groqCreate()
      .mockRejectedValueOnce(new Error('Groq down'))
      .mockResolvedValueOnce(providerResponse('', 'groq-model', 'stop'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValueOnce(providerResponse('OpenRouter response'))
      .mockResolvedValueOnce(providerResponse('', 'openrouter-model', 'stop'));

    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] })
    ).resolves.toMatchObject({ content: 'OpenRouter response', finishReason: 'stop' });
    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] })
    ).rejects.toThrow('OpenRouter returned an empty completion.');
    expect(groqCreate()).toHaveBeenCalledTimes(2);
    expect(openrouterClient.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it('falls back from malformed Groq JSON to a valid OpenRouter response', async () => {
    groqCreate().mockResolvedValueOnce(providerResponse('{"noteClaims":'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValueOnce(
        providerResponse('{"noteClaims":[],"generalKnowledge":[]}', 'openrouter-model')
      );

    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] }, true)
    ).resolves.toMatchObject({
      content: '{"noteClaims":[],"generalKnowledge":[]}',
      model: 'openrouter-model',
    });
    expect(openrouterClient.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Groq returned malformed JSON; falling back to OpenRouter.',
      { provider: 'Groq', model: 'groq-test' }
    );
  });

  it('returns a controlled error instead of parsing malformed OpenRouter JSON', async () => {
    groqCreate().mockResolvedValueOnce(providerResponse('{"noteClaims":'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValueOnce(providerResponse('{"noteClaims":', 'openrouter-model'));

    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] }, true)
    ).rejects.toMatchObject({
      name: 'LLMStructuredResponseException',
      statusCode: 500,
      code: 'LLM_RESPONSE_INVALID',
      message: 'The tutor could not produce a valid structured response.',
    });
    expect(logger.warn).toHaveBeenCalledWith('OpenRouter returned malformed JSON.', {
      provider: 'OpenRouter',
      model: 'openrouter-model',
    });
  });

  it('returns a controlled error for an empty OpenRouter structured response', async () => {
    groqCreate().mockRejectedValueOnce(new Error('Groq unavailable'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValueOnce(providerResponse('', 'openrouter-model'));

    await expect(
      getCompletion({ messages: [{ role: 'user', content: 'question' }] }, true)
    ).rejects.toMatchObject({
      name: 'LLMStructuredResponseException',
      statusCode: 500,
      code: 'LLM_RESPONSE_INVALID',
    });
  });

  it('answers with clearly disclosed general knowledge when retrieval finds no relevant notes', async () => {
    groqCreate().mockResolvedValueOnce(
      generatedResponse([], ['Aspirin irreversibly inhibits platelet cyclooxygenase-1.'])
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(vectorService.search).toHaveBeenCalledWith('question', 'user-1', 20, undefined);
    expect(prisma.userNote.findUnique).not.toHaveBeenCalled();
    expect(result.answer).toContain('**Additional general knowledge**');
    expect(result.answer).toContain('The answer was not found in your uploaded study materials.');
    expect(result.answer).toContain('was not found in your uploaded study materials');
    expect(result.answer).toContain('Please verify it against your prescribed textbooks');
    expect(result.sources).toEqual([]);
    expect(result.model).toBe('groq-test');
    expect(groqCreate()).toHaveBeenCalledTimes(1);
    expect(openrouterClient.chat.completions.create).not.toHaveBeenCalled();
    expect(tokenService.deductTokensOnceInTransaction).not.toHaveBeenCalled();
    expect(memoryService.saveChatInTransaction).toHaveBeenCalled();
  });

  it.each([
    'According to my uploaded notes, how does low-dose aspirin reduce platelet aggregation?',
    'What is the difference between the antiplatelet effects of aspirin and paracetamol?',
  ])('logs RAG diagnostic stages for any wording: %s', async (question) => {
    const ownMatch = noteMatch('own-chunk-id', 'user-1', 'own-note-id', 0.91, {
      text: 'The note describes aspirin and paracetamol antiplatelet effects.',
      documentName: 'pharmacology.pdf',
    });
    const privateOtherUserMatch = noteMatch('private-chunk-id', 'user-2', 'private-note-id', 0.99, {
      text: 'PRIVATE OTHER USER TEXT',
    });
    jest.mocked(vectorService.search).mockResolvedValue({
      query: question,
      matches: [ownMatch, privateOtherUserMatch],
    });
    jest.mocked(prisma.userNote.findMany).mockResolvedValue([]);
    process.env.RAG_LOCAL_ASPIRIN_TRACE = '1';
    process.env.RAG_LOCAL_ASPIRIN_TRACE_USER_ID = 'user-1';

    await service.chat({ question, userId: 'user-1' });

    const diagnosticCalls = jest
      .mocked(logger.info)
      .mock.calls.filter(([message]) => String(message).startsWith('RAG_LOCAL_ASPIRIN_TRACE'));
    const diagnosticLog = JSON.stringify(diagnosticCalls);
    expect(diagnosticLog).toContain('retrieval');
    expect(diagnosticLog).toContain('own-chunk-id');
    expect(diagnosticLog).toContain('own-note-id');
    expect(diagnosticLog).toContain('0.91');
    expect(diagnosticLog).toContain('The note describes aspirin and paracetamol');
    expect(diagnosticLog).toContain('context');
    expect(diagnosticLog).toContain('generated_response');
    expect(diagnosticLog).toContain('generated_claims');
    expect(diagnosticLog).toContain('verification_input');
    expect(diagnosticLog).toContain('verification_raw_output');
    expect(diagnosticLog).toContain('verification_results');
    expect(diagnosticLog).toContain('final_response');
    expect(diagnosticLog).not.toContain('PRIVATE OTHER USER TEXT');
    expect(diagnosticLog).not.toContain('private-chunk-id');
    expect(diagnosticLog).not.toContain('private-note-id');
  });

  it('does not emit diagnostics for a different authenticated user', async () => {
    process.env.RAG_LOCAL_ASPIRIN_TRACE = '1';
    process.env.RAG_LOCAL_ASPIRIN_TRACE_USER_ID = 'another-user';

    await service.chat({
      question:
        'What is the difference between the antiplatelet effects of aspirin and paracetamol?',
      userId: 'user-1',
    });

    expect(
      jest
        .mocked(logger.info)
        .mock.calls.filter(([message]) => String(message).startsWith('RAG_LOCAL_ASPIRIN_TRACE'))
    ).toHaveLength(0);
  });

  it('does not emit diagnostics outside development mode', async () => {
    Object.defineProperty(config, 'isDevelopment', { value: false, configurable: true });
    process.env.RAG_LOCAL_ASPIRIN_TRACE = '1';
    process.env.RAG_LOCAL_ASPIRIN_TRACE_USER_ID = 'user-1';

    await service.chat({
      question:
        'What is the difference between the antiplatelet effects of aspirin and paracetamol?',
      userId: 'user-1',
    });

    expect(
      jest
        .mocked(logger.info)
        .mock.calls.filter(([message]) => String(message).startsWith('RAG_LOCAL_ASPIRIN_TRACE'))
    ).toHaveLength(0);
  });

  it('does not emit diagnostics for selected-note requests', async () => {
    jest.mocked(prisma.userNote.findUnique).mockResolvedValue({
      id: 'selected-note',
      userId: 'user-1',
      isPublic: false,
      processingStatus: NoteProcStatus.COMPLETED,
    } as never);
    process.env.RAG_LOCAL_ASPIRIN_TRACE = '1';
    process.env.RAG_LOCAL_ASPIRIN_TRACE_USER_ID = 'user-1';

    await service.chat({
      question:
        'What is the difference between the antiplatelet effects of aspirin and paracetamol?',
      userId: 'user-1',
      noteId: 'selected-note',
    });

    expect(
      jest
        .mocked(logger.info)
        .mock.calls.filter(([message]) => String(message).startsWith('RAG_LOCAL_ASPIRIN_TRACE'))
    ).toHaveLength(0);
  });

  it('allows the owner to query a completed note and restricts sources, citations, and token deduction to it', async () => {
    jest.mocked(prisma.userNote.findUnique).mockResolvedValue({
      id: 'selected-note',
      userId: 'user-1',
      isPublic: false,
      processingStatus: NoteProcStatus.COMPLETED,
    } as never);
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [
        noteMatch('selected-vector', 'user-1', 'selected-note', 0.9),
        noteMatch('other-vector', 'user-1', 'other-note', 0.95),
        {
          id: 'shared-topic',
          score: 0.99,
          metadata: { text: 'Unselected shared topic', nodeType: 'topic' },
        },
      ],
    });

    const result = await service.chat({
      question: 'question',
      userId: 'user-1',
      noteId: 'selected-note',
      idempotencyKey: 'selected-note-request',
    });

    expect(vectorService.search).toHaveBeenCalledWith('question', 'user-1', 20, 'selected-note');
    expect(rerankingService.rerank).toHaveBeenCalledWith(
      'question',
      [expect.objectContaining({ id: 'selected-vector' })],
      5
    );
    expect(result.sources).toEqual([
      expect.objectContaining({ id: 'selected-vector', citationId: 'S1' }),
    ]);
    expect(result.answer).toBe('**From your uploaded notes**\n\n- Answer [S1]');
    expect(groqCreate().mock.calls[0]?.[0].messages).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ content: expect.stringContaining('Unselected shared topic') }),
      ])
    );
    expect(tokenService.deductTokensOnceInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        referenceId: expect.stringMatching(/^ai_chat:[a-f0-9]{64}$/),
        feature: 'ai_chat',
      })
    );
  });

  it('allows another user’s public completed note', async () => {
    jest.mocked(prisma.userNote.findUnique).mockResolvedValue({
      id: 'public-note',
      userId: 'user-2',
      isPublic: true,
      processingStatus: NoteProcStatus.COMPLETED,
    } as never);
    jest.mocked(prisma.userNote.findMany).mockResolvedValue([{ id: 'public-note' }] as never);
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('public-vector', 'user-2', 'public-note')],
    });

    await service.chat({ question: 'question', userId: 'user-1', noteId: 'public-note' });

    expect(vectorService.search).toHaveBeenCalledWith('question', 'user-1', 20, 'public-note');
    expect(prisma.userNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['public-note'] },
          isPublic: true,
          processingStatus: NoteProcStatus.COMPLETED,
        }),
      })
    );
  });

  it.each([
    ['private note owned by another user', 'user-2', false, NoteProcStatus.COMPLETED],
    ['own note that is still processing', 'user-1', false, NoteProcStatus.PROCESSING],
    ['public note that is still processing', 'user-2', true, NoteProcStatus.PROCESSING],
  ])(
    'rejects an inaccessible or incomplete selected note: %s',
    async (_label, ownerId, isPublic, status) => {
      jest.mocked(prisma.userNote.findUnique).mockResolvedValue({
        id: 'selected-note',
        userId: ownerId,
        isPublic,
        processingStatus: status,
      } as never);

      await expect(
        service.chat({ question: 'question', userId: 'user-1', noteId: 'selected-note' })
      ).rejects.toThrow();

      expect(vectorService.search).not.toHaveBeenCalled();
      expect(memoryService.saveChatInTransaction).not.toHaveBeenCalled();
      expect(tokenService.deductTokensOnceInTransaction).not.toHaveBeenCalled();
    }
  );

  it('rejects a missing selected note before retrieval', async () => {
    jest.mocked(prisma.userNote.findUnique).mockResolvedValue(null);

    await expect(
      service.chat({ question: 'question', userId: 'user-1', noteId: 'missing-note' })
    ).rejects.toThrow('Note not found');

    expect(vectorService.search).not.toHaveBeenCalled();
  });

  it('keeps shared global vectors and currently public notes, but removes private notes owned by others', async () => {
    const ownNote = noteMatch('own-vector', 'user-1', 'own-note');
    const publicNote = noteMatch('public-vector', 'user-2', 'public-note');
    const stalePrivateNote = noteMatch('stale-public-vector', 'user-3', 'now-private-note');
    const sharedTopic: VectorMatch = {
      id: 'topic-1',
      score: 0.95,
      metadata: { text: 'Shared topic text', nodeType: 'topic', subjectName: 'Anatomy' },
    };
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [ownNote, publicNote, stalePrivateNote, sharedTopic],
    });
    jest.mocked(prisma.userNote.findMany).mockResolvedValue([{ id: 'public-note' }] as never);

    await service.chat({ question: 'question', userId: 'user-1' });

    expect(rerankingService.rerank).toHaveBeenCalledWith(
      'question',
      [sharedTopic, ownNote, publicNote],
      5
    );
    expect(prisma.userNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['public-note', 'now-private-note'] },
          isPublic: true,
        }),
      })
    );
    expect(groqCreate()).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('Text for own-vector'),
          }),
          expect.objectContaining({
            content: expect.stringContaining('Text for public-vector'),
          }),
          expect.objectContaining({
            content: expect.stringContaining('Shared topic text'),
          }),
        ]),
      })
    );
    const sentMessages = groqCreate().mock.calls[0]?.[0].messages || [];
    expect(JSON.stringify(sentMessages)).not.toContain('Text for stale-public-vector');
  });

  it('reranks authorized matches without discarding chunks by Pinecone score', async () => {
    const lowScoreMatch = noteMatch('low', 'user-1', 'note-1', 0.01);
    const higherScoreMatch = noteMatch('high', 'user-1', 'note-1', 0.02, {
      documentName: 'cardiology.pdf',
      pageNumber: 4,
      subjectName: 'Physiology',
      topicName: 'Cardiac cycle',
      sourceId: 'note-note-1-chunk-2',
    });
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [lowScoreMatch, higherScoreMatch],
    });
    jest.mocked(rerankingService.rerank).mockResolvedValue([lowScoreMatch, higherScoreMatch]);

    groqCreate().mockResolvedValueOnce(
      generatedResponse([{ text: 'Supported claim', citations: ['S1', 'S2'] }])
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(rerankingService.rerank).toHaveBeenCalledWith(
      'question',
      expect.arrayContaining([
        expect.objectContaining({ id: 'low' }),
        expect.objectContaining({ id: 'high' }),
      ]),
      5
    );
    expect(result.answer).toBe('**From your uploaded notes**\n\n- Supported claim [S1] [S2]');
    expect(result.sources?.map((source) => source.id)).toEqual(['low', 'high']);
    const prompt = groqCreate().mock.calls[0]?.[0].messages || [];
    expect(JSON.stringify(prompt)).toContain('### [S1] Chunk low');
    expect(JSON.stringify(prompt)).toContain(
      '### [S2] cardiology.pdf | Page 4 | Physiology | Cardiac cycle'
    );
    expect(JSON.stringify(prompt)).toContain('One atomic claim supported by the notes');
    expect(JSON.stringify(prompt)).toContain('generalKnowledge');
  });

  it('uses reranked order for context, citation verification, and response sources', async () => {
    const first = noteMatch('first-by-vector', 'user-1', 'note-1', 0.91, {
      text: 'First chunk evidence.',
    });
    const rerankedFirst = noteMatch('reranked-first', 'user-1', 'note-2', 0.1, {
      text: 'Reranked first evidence.',
    });
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [first, rerankedFirst],
    });
    jest.mocked(rerankingService.rerank).mockResolvedValue([rerankedFirst, first]);
    groqCreate().mockResolvedValueOnce(
      generatedResponse([
        { text: 'First claim.', citations: ['S1'] },
        { text: 'Second claim.', citations: ['S2'] },
      ])
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.sources).toEqual([
      expect.objectContaining({ id: 'reranked-first', citationId: 'S1' }),
      expect.objectContaining({ id: 'first-by-vector', citationId: 'S2' }),
    ]);
    expect(result.answer).toContain('First claim. [S1]');
    expect(result.answer).toContain('Second claim. [S2]');
    const prompt = JSON.stringify(groqCreate().mock.calls[0]?.[0].messages);
    expect(prompt.indexOf('Reranked first evidence.')).toBeLessThan(
      prompt.indexOf('First chunk evidence.')
    );
    const verifierInput = String(groqCreate().mock.calls[1]?.[0].messages[1]?.content);
    expect(verifierInput).toContain('Reranked first evidence.');
    expect(verifierInput).toContain('First chunk evidence.');
    expect(JSON.parse(verifierInput)).toEqual({
      claims: [
        {
          claimIndex: 0,
          citationId: 'S1',
          claim: 'First claim.',
          evidence: 'Reranked first evidence.',
        },
        {
          claimIndex: 1,
          citationId: 'S2',
          claim: 'Second claim.',
          evidence: 'First chunk evidence.',
        },
      ],
    });
    expect(prompt).toContain(
      'For each individual note claim, check the text of each supplied chunk'
    );
    expect(prompt).toContain('Verify every claim against its corresponding chunk');
    expect(prompt).toContain(
      'never reuse a source ID merely because it appeared in a previous claim'
    );
    expect(prompt).toContain('omit it from noteClaims without inventing or assigning a citation');
  });

  it('accepts a Markdown-emphasized quote when the verifier preserves it verbatim', async () => {
    const evidence = 'Atrial contraction adds the *atrial kick* to ventricular filling.';
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('atrial-kick', 'user-1', 'note-1', 0.9, { text: evidence })],
    });
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse([{ text: 'Atrial contraction adds the atrial kick.', citations: ['S1'] }])
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({
            decisions: [
              {
                claimIndex: 0,
                citationId: 'S1',
                supported: true,
                supportingQuote: evidence,
              },
            ],
          })
        )
      );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).toContain('Atrial contraction adds the atrial kick. [S1]');
    expect(result.sources?.map((source) => source.id)).toEqual(['atrial-kick']);
    const verifierPrompt = String(groqCreate().mock.calls[1]?.[0].messages[0]?.content);
    expect(verifierPrompt).toContain('copy a supportingQuote verbatim');
    expect(verifierPrompt).toContain('Preserve every Markdown character (*, **, etc.)');
    expect(verifierPrompt).toContain(
      'punctuation mark, symbol, capitalization, and spacing exactly'
    );
    expect(verifierPrompt).toContain('Never paraphrase, correct, simplify, or reformat the quote');
    expect(verifierPrompt).toContain('return an empty supportingQuote');
  });

  it('rejects a verifier quote that omits Markdown emphasis from the evidence', async () => {
    const evidence = 'Atrial contraction adds the *atrial kick* to ventricular filling.';
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('atrial-kick', 'user-1', 'note-1', 0.9, { text: evidence })],
    });
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse([{ text: 'Atrial contraction adds the atrial kick.', citations: ['S1'] }])
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({
            decisions: [
              {
                claimIndex: 0,
                citationId: 'S1',
                supported: true,
                supportingQuote: 'Atrial contraction adds the atrial kick to ventricular filling.',
              },
            ],
          })
        )
      );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).not.toContain('Atrial contraction adds the atrial kick.');
    expect(result.sources).toEqual([]);
  });

  it('cites claims from their respective chunks and leaves unsupported information uncited', async () => {
    const matches = [
      noteMatch('ventricular-filling', 'user-1', 'note-1', 0.9, {
        text: 'Ventricular filling occurs during diastole.',
      }),
      noteMatch('isovolumetric-contraction', 'user-1', 'note-2', 0.8, {
        text: 'During isovolumetric contraction, all valves are closed.',
      }),
      noteMatch('heart-sounds', 'user-1', 'note-3', 0.7, {
        text: 'The first heart sound is S1 and the second heart sound is S2.',
      }),
    ];
    jest.mocked(vectorService.search).mockResolvedValue({ query: 'question', matches });
    jest.mocked(rerankingService.rerank).mockResolvedValue(matches);
    groqCreate().mockResolvedValueOnce(
      generatedResponse(
        [
          { text: 'Ventricular filling occurs during diastole.', citations: ['S1'] },
          {
            text: 'All valves are closed during isovolumetric contraction.',
            citations: ['S2'],
          },
          { text: 'The first and second heart sounds are S1 and S2.', citations: ['S3'] },
        ],
        ['An additional fact not stated in the retrieved chunks.']
      )
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).toContain('Ventricular filling occurs during diastole. [S1]');
    expect(result.answer).toContain('All valves are closed during isovolumetric contraction. [S2]');
    expect(result.answer).toContain('The first and second heart sounds are S1 and S2. [S3]');
    expect(result.answer).toContain('An additional fact not stated in the retrieved chunks.');
    expect(result.answer).not.toContain('An additional fact not stated in the retrieved chunks. [');
    expect(result.sources?.map((source) => source.citationId)).toEqual(['S1', 'S2', 'S3']);
    const answerPrompt = String(groqCreate().mock.calls[0]?.[0].messages[0]?.content);
    expect(answerPrompt).toContain(
      'never reuse a source ID merely because it appeared in a previous claim'
    );
    expect(answerPrompt).toContain(
      'omit it from noteClaims without inventing or assigning a citation'
    );
  });

  it('rejects an incorrect supplied citation without substituting a matching source', async () => {
    const unrelated = noteMatch('unrelated', 'user-1', 'note-1', 0.9, {
      text: 'This source describes an unrelated topic.',
    });
    const actualEvidence = noteMatch('actual-evidence', 'user-1', 'note-1', 0.8, {
      text: 'Heart sounds include S1 and S2.',
    });
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [unrelated, actualEvidence],
    });
    jest.mocked(rerankingService.rerank).mockResolvedValue([unrelated, actualEvidence]);
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse([{ text: 'Heart sounds include S1 and S2.', citations: ['S1'] }])
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({
            decisions: [
              {
                claimIndex: 0,
                citationId: 'S1',
                supported: false,
                supportingQuote: '',
              },
            ],
          })
        )
      );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    const verifierInput = JSON.parse(
      String(groqCreate().mock.calls[1]?.[0].messages[1]?.content)
    ) as { claims: Array<{ citationId: string; evidence: string }> };
    expect(verifierInput.claims).toEqual([
      {
        claimIndex: 0,
        citationId: 'S1',
        claim: 'Heart sounds include S1 and S2.',
        evidence: unrelated.metadata.text,
      },
    ]);
    expect(result.answer).not.toContain('Heart sounds include S1 and S2.');
    expect(result.sources).toEqual([]);
  });

  it('deduplicates identical claims while preserving distinct facts and independent citations', async () => {
    const matches = [
      noteMatch('insulin-source-1', 'user-1', 'note-1', 0.9, {
        text: 'Beta cells release insulin.',
      }),
      noteMatch('insulin-source-2', 'user-1', 'note-2', 0.8, {
        text: 'Beta cells release insulin.',
      }),
      noteMatch('glucose-source', 'user-1', 'note-3', 0.7, {
        text: 'Insulin lowers blood glucose.',
      }),
    ];
    jest.mocked(vectorService.search).mockResolvedValue({ query: 'question', matches });
    jest.mocked(rerankingService.rerank).mockResolvedValue(matches);
    groqCreate().mockResolvedValueOnce(
      generatedResponse(
        [
          { text: 'Beta cells release insulin.', citations: ['S1'] },
          { text: ' Beta   cells release insulin. ', citations: ['S2'] },
          { text: 'Insulin lowers blood glucose.', citations: ['S3'] },
        ],
        ['An additional fact.', 'An   additional fact.']
      )
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer.match(/Beta cells release insulin\./g)).toHaveLength(1);
    expect(result.answer).toContain('Beta cells release insulin. [S1] [S2]');
    expect(result.answer).toContain('Insulin lowers blood glucose. [S3]');
    expect(result.answer.match(/An additional fact\./g)).toHaveLength(1);
    expect(result.sources?.map((source) => source.citationId)).toEqual(['S1', 'S2', 'S3']);
  });

  it('uses the original compound question to rerank merged authorized search results', async () => {
    const question =
      'Explain the mechanism of aspirin and also explain why aspirin is used for secondary prevention of heart attacks.';
    const match = noteMatch('aspirin-mechanism', 'user-1', 'pharmacology-note');
    jest.mocked(vectorService.search).mockImplementation(async (query) => ({
      query,
      matches: query.toLowerCase().includes('mechanism') ? [match] : [],
    }));

    await service.chat({ question, userId: 'user-1' });

    expect(vectorService.search).toHaveBeenCalledTimes(3);
    expect(rerankingService.rerank).toHaveBeenCalledTimes(1);
    expect(rerankingService.rerank).toHaveBeenCalledWith(question, [match], 5);
  });

  it('does not send private notes owned by other users to the reranker', async () => {
    const owned = noteMatch('owned', 'user-1', 'owned-note');
    const privateOther = noteMatch('private-other', 'user-2', 'private-note');
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [owned, privateOther],
    });

    await service.chat({ question: 'question', userId: 'user-1' });

    expect(rerankingService.rerank).toHaveBeenCalledWith('question', [owned], 5);
  });

  it('aborts chat generation when reranking fails instead of passing raw candidates through', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('candidate', 'user-1', 'note-1')],
    });
    jest
      .mocked(rerankingService.rerank)
      .mockRejectedValue(new Error('The relevance reranking service is unavailable.'));

    await expect(service.chat({ question: 'question', userId: 'user-1' })).rejects.toThrow(
      'The relevance reranking service is unavailable.'
    );
    expect(groqCreate()).not.toHaveBeenCalled();
    expect(openrouterClient.chat.completions.create).not.toHaveBeenCalled();
    expect(memoryService.saveChatInTransaction).not.toHaveBeenCalled();
  });

  it('supplements partially supported notes with separately labelled general knowledge', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('aspirin-note', 'user-1', 'note-1')],
    });
    groqCreate().mockResolvedValueOnce(
      generatedResponse(
        [
          {
            text: 'The notes state that aspirin inhibits platelet cyclooxygenase.',
            citations: ['S1'],
          },
        ],
        ['This reduces thromboxane A2 formation and platelet aggregation.']
      )
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).toContain('**From your uploaded notes**');
    expect(result.answer).toContain('aspirin inhibits platelet cyclooxygenase. [S1]');
    expect(result.answer).toContain('**Additional general knowledge**');
    expect(result.answer).toContain(
      'The uploaded materials did not contain enough information to fully answer the question.'
    );
    expect(result.answer).toContain('This reduces thromboxane A2 formation');
    expect(result.answer).toContain(
      'This information is based on general medical knowledge and was not found in your uploaded study materials.'
    );
  });

  it('answers the uploaded aspirin-note question with grounded claims and separate elaboration', async () => {
    const noteText =
      'Low-dose aspirin irreversibly inhibits COX-1 in platelets. This reduces thromboxane A2 production and decreases platelet aggregation.';
    const question =
      'According to my uploaded notes, how does low-dose aspirin reduce platelet aggregation?';
    jest.mocked(vectorService.search).mockResolvedValue({
      query: question,
      matches: [
        noteMatch('aspirin-mechanism', 'user-1', 'pharmacology-note', 0.92, { text: noteText }),
      ],
    });
    groqCreate().mockResolvedValueOnce(
      generatedResponse(
        [
          {
            text: 'Low-dose aspirin irreversibly inhibits COX-1 in platelets.',
            citations: ['S1'],
          },
          {
            text: 'This reduces thromboxane A2 production and decreases platelet aggregation.',
            citations: ['S1'],
          },
        ],
        ['Reduced thromboxane A2 signaling weakens the signal that promotes platelet aggregation.']
      )
    );

    const result = await service.chat({
      question,
      userId: 'user-1',
    });

    expect(result.answer).toContain('**From your uploaded notes**');
    expect(result.answer).toContain(
      'Low-dose aspirin irreversibly inhibits COX-1 in platelets. [S1]'
    );
    expect(result.answer).toContain(
      'This reduces thromboxane A2 production and decreases platelet aggregation. [S1]'
    );
    expect(result.answer).toContain('**Additional general knowledge**');
    expect(result.answer).toContain(
      'Reduced thromboxane A2 signaling weakens the signal that promotes platelet aggregation.'
    );
    expect(result.answer).not.toContain(
      'Reduced thromboxane A2 signaling weakens the signal that promotes platelet aggregation. [S1]'
    );
    expect(result.sources).toEqual([expect.objectContaining({ id: 'aspirin-mechanism' })]);
  });

  it('does not cite an unsupported aspirin dosage claim as note-based information', async () => {
    const noteText =
      'Low-dose aspirin irreversibly inhibits platelet COX-1 and decreases thromboxane A2 production.';
    jest.mocked(vectorService.search).mockResolvedValue({
      query:
        'According to my uploaded notes, what is the recommended daily dose of aspirin for antiplatelet activity?',
      matches: [
        noteMatch('aspirin-dose-source', 'user-1', 'pharmacology-note', 0.91, {
          text: noteText,
          documentName: 'pharmacology-test.pdf',
        }),
      ],
    });
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse(
          [
            {
              text: 'The recommended daily dose of aspirin for antiplatelet activity is ≤100 mg/day.',
              citations: ['S1'],
            },
          ],
          ['The uploaded note does not state a recommended daily dose.']
        )
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({
            decisions: [
              {
                claimIndex: 0,
                citationId: 'S1',
                supported: true,
                supportingQuote: noteText,
              },
            ],
          })
        )
      );

    const result = await service.chat({
      question:
        'According to my uploaded notes, what is the recommended daily dose of aspirin for antiplatelet activity?',
      userId: 'user-1',
    });

    expect(result.answer).not.toContain('≤100 mg/day');
    expect(result.answer).not.toContain('≤100 mg/day [S1]');
    expect(result.answer).toContain('**Additional general knowledge**');
    expect(result.answer).toContain('The uploaded note does not state a recommended daily dose.');
    expect(result.sources).toEqual([]);
    const verifierInput = String(groqCreate().mock.calls[1]?.[0].messages[1]?.content);
    expect(verifierInput).toContain(noteText);
    expect(verifierInput).not.toContain('pharmacology-test.pdf');
  });

  it('retrieves a mechanism clause separately and combines it with general knowledge for a mixed question', async () => {
    const question =
      'Explain the mechanism of aspirin and also explain why aspirin is used for secondary prevention of heart attacks.';
    const mechanism = noteMatch('aspirin-mechanism', 'user-1', 'pharmacology-note', 0.89, {
      text: 'Low-dose aspirin irreversibly inhibits platelet COX-1 and decreases thromboxane A2 production.',
    });
    jest.mocked(vectorService.search).mockImplementation(async (query) => ({
      query,
      matches: query.toLowerCase().includes('mechanism') ? [mechanism] : [],
    }));
    groqCreate().mockResolvedValueOnce(
      generatedResponse(
        [
          {
            text: 'The notes state that aspirin irreversibly inhibits platelet COX-1 and decreases thromboxane A2 production.',
            citations: ['S1'],
          },
        ],
        [
          'For secondary prevention, antiplatelet therapy can reduce recurrent atherothrombotic events by limiting platelet-mediated clot formation.',
        ]
      )
    );

    const result = await service.chat({ question, userId: 'user-1' });

    expect(vectorService.search).toHaveBeenCalledTimes(3);
    expect(vectorService.search).toHaveBeenNthCalledWith(1, question, 'user-1', 20, undefined);
    expect(vectorService.search).toHaveBeenNthCalledWith(
      2,
      'Explain the mechanism of aspirin',
      'user-1',
      20,
      undefined
    );
    expect(vectorService.search).toHaveBeenNthCalledWith(
      3,
      'explain why aspirin is used for secondary prevention of heart attacks',
      'user-1',
      20,
      undefined
    );
    expect(result.answer).toContain('**From your uploaded notes**');
    expect(result.answer).toContain('decreases thromboxane A2 production. [S1]');
    expect(result.answer).toContain('**Additional general knowledge**');
    expect(result.answer).toContain('secondary prevention');
    expect(result.sources).toEqual([expect.objectContaining({ id: 'aspirin-mechanism' })]);
  });

  it('does not attach uploaded-note citations to general-knowledge claims', async () => {
    groqCreate().mockResolvedValueOnce(
      generatedResponse([], ['General medical explanation [S1].'])
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).toContain('General medical explanation.');
    expect(result.answer).not.toContain('[S1]');
    expect(result.sources).toEqual([]);
  });

  it('rejects a verifier quote that does not exactly occur in the cited chunk', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('source-1', 'user-1', 'note-1')],
    });
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse([{ text: 'Claim unsupported by the note.', citations: ['S1'] }])
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({
            decisions: [
              {
                claimIndex: 0,
                citationId: 'S1',
                supported: true,
                supportingQuote: 'A fabricated quote not in this source.',
              },
            ],
          })
        )
      );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).not.toContain('Claim unsupported by the note.');
    expect(result.sources).toEqual([]);
  });

  it('uses the same evidence acceptance decision for diagnostics and verified claims', async () => {
    const matches = [
      noteMatch('valid', 'user-1', 'note-1', 0.9, {
        text: 'The cells release insulin.',
      }),
      noteMatch('unsupported', 'user-1', 'note-1', 0.9, {
        text: 'The cells release insulin.',
      }),
      noteMatch('inexact-quote', 'user-1', 'note-1', 0.9, {
        text: 'The cells release insulin.',
      }),
      noteMatch('missing-number', 'user-1', 'note-1', 0.9, {
        text: 'Treatment lasts several days.',
      }),
      noteMatch('valid-dose', 'user-1', 'note-1', 0.9, {
        text: 'Recommended dose: 75 mg daily.',
      }),
      noteMatch('inexact-dose', 'user-1', 'note-1', 0.9, {
        text: 'Recommended dose: 75 mg daily.',
      }),
      noteMatch('invalid-citation', 'user-1', 'note-1', 0.9, {
        text: 'The cells release insulin.',
      }),
      noteMatch('valid-second-citation', 'user-1', 'note-1', 0.9, {
        text: 'The note explicitly states that cells release insulin.',
      }),
    ];
    jest.mocked(vectorService.search).mockResolvedValue({ query: 'question', matches });
    jest.mocked(rerankingService.rerank).mockResolvedValue(matches);
    process.env.RAG_LOCAL_ASPIRIN_TRACE = '1';
    process.env.RAG_LOCAL_ASPIRIN_TRACE_USER_ID = 'user-1';
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse([
          { text: 'The cells release insulin.', citations: ['S1'] },
          { text: 'Unsupported claim.', citations: ['S2'] },
          { text: 'The pancreatic cells release insulin.', citations: ['S3'] },
          { text: 'Treatment lasts 10 days.', citations: ['S4'] },
          { text: 'The recommended dose is 75 mg daily.', citations: ['S5'] },
          { text: 'The recommended dose is 75 mg/day.', citations: ['S6'] },
          { text: 'The notes state that cells release insulin.', citations: ['S7', 'S8'] },
        ])
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({
            decisions: [
              {
                claimIndex: 0,
                citationId: 'S1',
                supported: true,
                supportingQuote: 'The cells release insulin.',
              },
              {
                claimIndex: 1,
                citationId: 'S2',
                supported: false,
                supportingQuote: 'The cells release insulin.',
              },
              {
                claimIndex: 2,
                citationId: 'S3',
                supported: true,
                supportingQuote: 'A fabricated quote.',
              },
              {
                claimIndex: 3,
                citationId: 'S4',
                supported: true,
                supportingQuote: 'Treatment lasts several days.',
              },
              {
                claimIndex: 4,
                citationId: 'S5',
                supported: true,
                supportingQuote: 'Recommended dose: 75 mg daily.',
              },
              {
                claimIndex: 5,
                citationId: 'S6',
                supported: true,
                supportingQuote: 'Recommended dose: 75 mg daily.',
              },
              {
                claimIndex: 6,
                citationId: 'S7',
                supported: false,
                supportingQuote: 'The cells release insulin.',
              },
              {
                claimIndex: 6,
                citationId: 'S8',
                supported: true,
                supportingQuote: 'The note explicitly states that cells release insulin.',
              },
            ],
          })
        )
      );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).toContain('The cells release insulin. [S1]');
    expect(result.answer).toContain('The recommended dose is 75 mg daily. [S5]');
    expect(result.answer).toContain('The notes state that cells release insulin. [S8]');
    expect(result.answer).not.toContain('Unsupported claim.');
    expect(result.answer).not.toContain('Treatment lasts 10 days.');
    expect(result.answer).not.toContain('[S3]');
    expect(result.answer).not.toContain('[S6]');
    expect(result.sources?.map((source) => source.citationId)).toEqual(['S1', 'S5', 'S8']);

    const verificationLog = jest
      .mocked(logger.info)
      .mock.calls.find(
        ([message]) => String(message) === 'RAG_LOCAL_ASPIRIN_TRACE verification_results'
      );
    expect(verificationLog).toBeDefined();
    const verificationDetails = JSON.parse(JSON.stringify(verificationLog)) as [
      string,
      { results: Array<{ citationId: string; accepted: boolean }> },
    ];
    expect(
      verificationDetails[1].results.filter((item) => item.accepted).map((item) => item.citationId)
    ).toEqual(result.sources?.map((source) => source.citationId));
    expect(verificationDetails[1].results.map((item) => item.accepted)).toEqual([
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      true,
    ]);
  });

  it('preserves useful definition, comparison-table, mechanism, and process structure', async () => {
    groqCreate().mockResolvedValueOnce(
      generatedResponse(
        [],
        [
          'Definition: Aspirin is an antiplatelet medicine that affects platelet function.',
          'Mechanism: COX-1 inhibition → reduced thromboxane A2 production → reduced platelet aggregation.',
          'Comparison:\n| Feature | A | B |\n|---|---|---|\n| Main effect | X | Y |',
          'Process:\n1. First stage.\n2. Next stage.',
        ]
      )
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).toContain('Definition:');
    expect(result.answer).toContain('→ reduced thromboxane A2 production');
    expect(result.answer).toContain('| Feature | A | B |');
    expect(result.answer).toContain('1. First stage.');
    expect(result.answer).toContain('**Additional general knowledge**');
  });

  it('skips citation verification only for the enabled local-development bypass', async () => {
    process.env.NODE_ENV = 'development';
    process.env.RAG_LOCAL_SKIP_CITATION_VERIFICATION = '1';
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [
        noteMatch('local-source', 'user-1', 'note-1', 0.9, {
          text: 'The atrial kick contributes to ventricular filling.',
        }),
      ],
    });
    groqCreate().mockResolvedValueOnce(
      generatedResponse(
        [{ text: 'The atrial kick contributes to ventricular filling.', citations: ['S1'] }],
        ['A separate general-knowledge fact.']
      )
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(groqCreate()).toHaveBeenCalledTimes(1);
    expect(
      groqCreate().mock.calls.some((call) =>
        String(call[0].messages[0]?.content).includes('strict evidence verifier')
      )
    ).toBe(false);
    expect(result.answer).toContain('**UNVERIFIED LOCAL TESTING OUTPUT — CITATIONS NOT VERIFIED**');
    expect(result.answer).toContain(
      '**From your uploaded notes**\n\n- The atrial kick contributes to ventricular filling. [S1]'
    );
    expect(result.answer).toContain('**Additional general knowledge**');
    expect(result.answer).toContain('- A separate general-knowledge fact.');
    expect(result.sources).toEqual([
      expect.objectContaining({ id: 'local-source', citationId: 'S1' }),
    ]);
  });

  it('runs normal citation verification when the local bypass flag is disabled', async () => {
    process.env.NODE_ENV = 'development';
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [
        noteMatch('verified-source', 'user-1', 'note-1', 0.9, {
          text: 'Evidence for the generated claim.',
        }),
      ],
    });
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse([{ text: 'Evidence for the generated claim.', citations: ['S1'] }])
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({
            decisions: [
              {
                claimIndex: 0,
                citationId: 'S1',
                supported: true,
                supportingQuote: 'Evidence for the generated claim.',
              },
            ],
          })
        )
      );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(groqCreate()).toHaveBeenCalledTimes(2);
    expect(String(groqCreate().mock.calls[1]?.[0].messages[0]?.content)).toContain(
      'strict evidence verifier'
    );
    expect(result.answer).not.toContain('UNVERIFIED LOCAL TESTING OUTPUT');
    expect(result.answer).toContain('Evidence for the generated claim. [S1]');
  });

  it('does not activate citation-verification bypass in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RAG_LOCAL_SKIP_CITATION_VERIFICATION = '1';
    Object.defineProperty(config, 'isDevelopment', { value: false, configurable: true });
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [
        noteMatch('production-source', 'user-1', 'note-1', 0.9, {
          text: 'Evidence for the generated claim.',
        }),
      ],
    });
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse([{ text: 'Evidence for the generated claim.', citations: ['S1'] }])
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({
            decisions: [
              {
                claimIndex: 0,
                citationId: 'S1',
                supported: true,
                supportingQuote: 'Evidence for the generated claim.',
              },
            ],
          })
        )
      );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(groqCreate()).toHaveBeenCalledTimes(2);
    expect(String(groqCreate().mock.calls[1]?.[0].messages[0]?.content)).toContain(
      'strict evidence verifier'
    );
    expect(result.answer).not.toContain('UNVERIFIED LOCAL TESTING OUTPUT');
    expect(result.answer).toContain('Evidence for the generated claim. [S1]');
  });

  it('drops invalid citation IDs instead of exposing unsupported note claims', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('only-source', 'user-1', 'note-1')],
    });
    groqCreate().mockResolvedValueOnce(
      generatedResponse([{ text: 'Unverified claim', citations: ['S9'] }])
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).not.toContain('Unverified claim');
    expect(result.answer).not.toContain('[S9]');
    expect(result.sources).toEqual([]);
    expect(groqCreate()).toHaveBeenCalledTimes(1);
  });

  it('omits a cited claim when its retrieved source does not support it', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('source-1', 'user-1', 'note-1')],
    });
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse(
          [{ text: 'Claim contradicted by the source.', citations: ['S1'] }],
          ['A separate general explanation.']
        )
      )
      .mockResolvedValueOnce(
        providerResponse(
          JSON.stringify({ decisions: [{ claimIndex: 0, citationId: 'S1', supported: false }] })
        )
      );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).not.toContain('Claim contradicted by the source.');
    expect(result.answer).toContain('**Additional general knowledge**');
    expect(result.answer).toContain('A separate general explanation.');
    expect(result.answer).not.toContain('[S1]');
    expect(result.sources).toEqual([]);
  });

  it('omits note claims when evidence verification fails', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('source-1', 'user-1', 'note-1')],
    });
    groqCreate()
      .mockResolvedValueOnce(
        generatedResponse(
          [{ text: 'Claim that needs verification.', citations: ['S1'] }],
          ['A cautious general explanation.']
        )
      )
      .mockRejectedValueOnce(new Error('Verifier unavailable'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockRejectedValueOnce(new Error('Verifier fallback unavailable'));

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).not.toContain('Claim that needs verification.');
    expect(result.answer).toContain('A cautious general explanation.');
    expect(result.answer).toContain('**Additional general knowledge**');
    expect(result.sources).toEqual([]);
    expect(result.tokensUsed).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      'RAG citation evidence verification failed; omitting note claims:',
      expect.any(Error)
    );
  });

  it('cites claims from multiple eligible notes when evidence is distributed across them', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [
        noteMatch('source-one', 'user-1', 'note-one', 0.91, { documentName: 'note-one.pdf' }),
        noteMatch('source-two', 'user-1', 'note-two', 0.88, { documentName: 'note-two.pdf' }),
      ],
    });
    groqCreate().mockResolvedValueOnce(
      generatedResponse([
        { text: 'First supported fact.', citations: ['S1'] },
        { text: 'Second supported fact.', citations: ['S2'] },
      ])
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.answer).toContain('First supported fact. [S1]');
    expect(result.answer).toContain('Second supported fact. [S2]');
    expect(result.sources).toEqual([
      expect.objectContaining({ id: 'source-one', citationId: 'S1' }),
      expect.objectContaining({ id: 'source-two', citationId: 'S2' }),
    ]);
    const generationPrompt = groqCreate().mock.calls[0]?.[0].messages || [];
    expect(JSON.stringify(generationPrompt)).toContain('note-one.pdf');
    expect(JSON.stringify(generationPrompt)).toContain('note-two.pdf');
  });

  it('returns only the relevant cited source when several notes were retrieved', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [
        noteMatch('relevant-source', 'user-1', 'relevant-note', 0.91, {
          documentName: 'relevant.pdf',
        }),
        noteMatch('unrelated-source', 'user-1', 'unrelated-note', 0.84, {
          documentName: 'unrelated.pdf',
        }),
      ],
    });
    groqCreate().mockResolvedValueOnce(
      generatedResponse([{ text: 'The relevant note supports this fact.', citations: ['S1'] }])
    );

    const result = await service.chat({ question: 'question', userId: 'user-1' });

    expect(result.sources).toEqual([expect.objectContaining({ id: 'relevant-source' })]);
    expect(result.answer).not.toContain('[S2]');
    const generationPrompt = groqCreate().mock.calls[0]?.[0].messages || [];
    expect(JSON.stringify(generationPrompt)).toContain('relevant.pdf');
    expect(JSON.stringify(generationPrompt)).toContain('unrelated.pdf');
  });

  it('falls back from Groq to OpenRouter and deducts once using the caller idempotency key', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('own-vector', 'user-1', 'own-note')],
    });
    groqCreate().mockRejectedValueOnce(new Error('Groq down'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockResolvedValue(
        generatedResponse([{ text: 'OpenRouter answer', citations: ['S1'] }], [], 'openrouter-test')
      );

    const result = await service.chat({
      question: 'question',
      userId: 'user-1',
      idempotencyKey: 'request-123',
    });

    expect(result.model).toBe('openrouter-test');
    expect(openrouterClient.chat.completions.create).toHaveBeenCalledTimes(1);
    expect(tokenService.deductTokensOnceInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        referenceId: expect.stringMatching(/^ai_chat:[a-f0-9]{64}$/),
        feature: 'ai_chat',
      })
    );
  });

  it('rejects reuse of an idempotency key for a different request before retrieval', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('own-vector', 'user-1', 'own-note')],
    });
    const conflict = new Error('Idempotency key was already used for a different request');
    jest
      .mocked(memoryService.claimChatRequest)
      .mockResolvedValueOnce({
        status: 'claimed',
        id: 'request-1',
        claimToken: 'claim-token-1',
      })
      .mockRejectedValueOnce(conflict);

    await service.chat({
      question: 'First question?',
      userId: 'user-1',
      idempotencyKey: 'reused-key',
    });
    await expect(
      service.chat({
        question: 'Different question?',
        userId: 'user-1',
        idempotencyKey: 'reused-key',
      })
    ).rejects.toBe(conflict);
    expect(vectorService.search).toHaveBeenCalledTimes(1);
    expect(tokenService.deductTokensOnceInTransaction).toHaveBeenCalledTimes(1);
  });

  it('replays the stored response for an identical idempotent retry without repeating work', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('own-vector', 'user-1', 'own-note')],
    });
    const request = {
      question: 'Retry this question?',
      userId: 'user-1',
      idempotencyKey: 'retry-key',
    };

    const firstResult = await service.chat(request);
    jest.mocked(memoryService.claimChatRequest).mockResolvedValueOnce({
      status: 'completed',
      response: firstResult,
    });
    const retryResult = await service.chat(request);

    expect(retryResult).toEqual(firstResult);
    expect(vectorService.search).toHaveBeenCalledTimes(1);
    expect(groqCreate()).toHaveBeenCalledTimes(2);
    expect(memoryService.saveChatInTransaction).toHaveBeenCalledTimes(1);
    expect(tokenService.deductTokensOnceInTransaction).toHaveBeenCalledTimes(1);
  });

  it('prevents a concurrent identical retry from running a second LLM request', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('own-vector', 'user-1', 'own-note')],
    });
    let markProviderStarted: () => void = () => undefined;
    let resolveProvider: (value: never) => void = () => undefined;
    const providerStarted = new Promise<void>((resolve) => {
      markProviderStarted = resolve;
    });
    const providerResponsePending = new Promise<never>((resolve) => {
      resolveProvider = resolve;
    });
    groqCreate().mockImplementationOnce((() => {
      markProviderStarted();
      return providerResponsePending as never;
    }) as never);

    const request = {
      question: 'Concurrent retry?',
      userId: 'user-1',
      idempotencyKey: 'concurrent-key',
    };
    const firstRequest = service.chat(request);
    await providerStarted;

    jest
      .mocked(memoryService.claimChatRequest)
      .mockRejectedValueOnce(new Error('A request with this idempotency key is still in progress'));
    await expect(service.chat(request)).rejects.toThrow('still in progress');

    expect(vectorService.search).toHaveBeenCalledTimes(1);
    expect(groqCreate()).toHaveBeenCalledTimes(1);
    expect(memoryService.saveChatInTransaction).not.toHaveBeenCalled();

    resolveProvider(generatedResponse([{ text: 'Concurrent answer', citations: ['S1'] }]));
    await firstRequest;
    expect(memoryService.saveChatInTransaction).toHaveBeenCalledTimes(1);
    expect(tokenService.deductTokensOnceInTransaction).toHaveBeenCalledTimes(1);
  });

  it('does not save or charge a failed provider response', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('own-vector', 'user-1', 'own-note')],
    });
    groqCreate().mockRejectedValueOnce(new Error('Groq down'));
    jest
      .mocked(openrouterClient.chat.completions.create)
      .mockRejectedValueOnce(new Error('OpenRouter down'));

    await expect(service.chat({ question: 'question', userId: 'user-1' })).rejects.toThrow(
      'OpenRouter down'
    );
    expect(memoryService.saveChatInTransaction).not.toHaveBeenCalled();
    expect(tokenService.deductTokensOnceInTransaction).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('atomically saves the chat, charges tokens, and completes the idempotency record', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('own-vector', 'user-1', 'own-note')],
    });
    const tx = {};
    jest.mocked(prisma.$transaction).mockImplementation(async (callback) => callback(tx as never));

    await service.chat({
      question: 'question',
      userId: 'user-1',
      idempotencyKey: 'atomic-request',
    });

    expect(memoryService.saveChatInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ userId: 'user-1' })
    );
    expect(tokenService.deductTokensOnceInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ userId: 'user-1' })
    );
    expect(memoryService.completeChatRequestInTransaction).toHaveBeenCalledWith(
      tx,
      'request-1',
      'claim-token-1',
      'chat-1',
      expect.objectContaining({ answer: '**From your uploaded notes**\n\n- Answer [S1]' })
    );
  });

  it('aborts chat completion when transactional token deduction fails', async () => {
    jest.mocked(vectorService.search).mockResolvedValue({
      query: 'question',
      matches: [noteMatch('own-vector', 'user-1', 'own-note')],
    });
    const chargeError = new Error('Insufficient tokens');
    jest.mocked(tokenService.deductTokensOnceInTransaction).mockRejectedValue(chargeError);

    await expect(
      service.chat({
        question: 'question',
        userId: 'user-1',
        idempotencyKey: 'failed-charge',
      })
    ).rejects.toBe(chargeError);

    expect(memoryService.saveChatInTransaction).toHaveBeenCalled();
    expect(memoryService.completeChatRequestInTransaction).not.toHaveBeenCalled();
    expect(memoryService.releaseChatRequest).toHaveBeenCalledWith('request-1', 'claim-token-1');
  });
});
