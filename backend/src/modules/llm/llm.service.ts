/**
 * LLM Service
 * Core RAG orchestrator for MBBS chatbot
 */

import { openrouterClient } from './clients/openrouter.client';
import { vectorService } from './vector/vector.service';
import { memoryService } from './memory/memory.service';
import { MBBS_TUTOR_SYSTEM_PROMPT, CONTEXT_WRAPPER } from './prompts/system.prompt';
import {
  ChatRequest,
  ChatResponse,
  LLMMessage,
  LLMCompletionParams,
  LLMCompletionResult,
  VectorMatch,
} from './llm.types';

const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;
const TOP_K_RESULTS = 5;
const MIN_RELEVANCE_SCORE = 0.7;

/**
 * LLM Service Class
 */
class LLMService {
  /**
   * Process a chat request using RAG
   * @param request - Chat request with question
   * @returns Chat response with answer and metadata
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { question, userId } = request;

    // Step 1: Search for relevant context
    const searchResult = await vectorService.search(question, TOP_K_RESULTS);

    // Step 2: Filter by relevance score
    const relevantMatches = searchResult.matches.filter(
      (match) => match.score >= MIN_RELEVANCE_SCORE
    );

    // Step 3: Build context from matches
    const context = this.buildContext(relevantMatches);

    // Step 4: Create messages for LLM
    const messages = this.buildMessages(context, question);

    // Step 5: Get completion from LLM
    const completion = await this.getCompletion({
      messages,
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      maxTokens: DEFAULT_MAX_TOKENS,
    });

    // Step 6: Save chat to memory
    await memoryService.saveChat({
      userId,
      question,
      response: completion.content,
    });

    // Step 7: Return response
    return {
      answer: completion.content,
      tokensUsed: completion.tokensUsed,
      model: completion.model,
      sources: relevantMatches.length > 0 ? relevantMatches : undefined,
    };
  }

  /**
   * Build context string from vector matches
   */
  private buildContext(matches: VectorMatch[]): string {
    if (matches.length === 0) {
      return 'No specific study material found. Answer based on general medical knowledge.';
    }

    return matches
      .map((match, index) => {
        const source = match.metadata.topicName
          ? `[Source: ${match.metadata.subjectName} > ${match.metadata.topicName}]`
          : '';
        return `### Context ${index + 1} ${source}\n${match.metadata.text}`;
      })
      .join('\n\n');
  }

  /**
   * Build messages array for LLM
   */
  private buildMessages(context: string, question: string): LLMMessage[] {
    return [
      {
        role: 'system',
        content: MBBS_TUTOR_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: CONTEXT_WRAPPER(context, question),
      },
    ];
  }

  /**
   * Get completion from OpenRouter
   */
  private async getCompletion(params: LLMCompletionParams): Promise<LLMCompletionResult> {
    const {
      messages,
      model = DEFAULT_MODEL,
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
    } = params;

    const response = await openrouterClient.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content || 'Unable to generate response.';

    return {
      content,
      tokensUsed: response.usage?.total_tokens || null,
      model: response.model || model,
    };
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(userId: string, limit?: number) {
    return memoryService.getChatHistory(userId, limit);
  }

  /**
   * Clear chat history for a user
   */
  async clearChatHistory(userId: string): Promise<void> {
    await memoryService.deleteChatHistory(userId);
  }
}

export const llmService = new LLMService();
