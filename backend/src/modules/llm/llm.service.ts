/**
 * LLM Service
 * Core RAG orchestrator for MBBS chatbot
 */

import { openrouterClient } from './clients/openrouter.client';
import { groqClient } from './clients/groq.client';
import { config, logger } from '@/config';
import { vectorService } from './vector/vector.service';
import { memoryService } from './memory/memory.service';
import { tokenService } from '../token/token.service';
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

    // Step 7: Deduct token (1 token per AI interaction)
    if (userId) {
      try {
        await tokenService.deductTokens({
          userId,
          amount: 1,
          feature: 'ai_chat',
          description: `AI Interaction: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`,
        });
      } catch (err) {
        logger.error(`Failed to deduct token for user ${userId}:`, err);
        // We continue anyway as the chat is already processed
      }
    }

    // Step 8: Return response
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
      model,
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
    } = params;

    // 1. Try Groq if configured (Primary for now as per user request)
    if (groqClient) {
      try {
        // If it's a Groq model name, use it directly, otherwise use the default Groq model
        const groqModel = model && !model.includes('/') ? model : config.groq.defaultModel;
        
        const response = await groqClient.chat.completions.create({
          model: groqModel,
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        return {
          content: response.choices[0]?.message?.content || 'Unable to generate response.',
          tokensUsed: response.usage?.total_tokens || null,
          model: response.model || groqModel,
        };
      } catch (error) {
        logger.error('Groq completion failed, falling back to OpenRouter:', error);
      }
    }

    // 2. Fallback to OpenRouter
    const openrouterModel = model || DEFAULT_MODEL;
    const response = await openrouterClient.chat.completions.create({
      model: openrouterModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content || 'Unable to generate response.';

    return {
      content,
      tokensUsed: response.usage?.total_tokens || null,
      model: response.model || openrouterModel,
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

  /**
   * Summarize text using specialized medical prompt
   * @param text - Raw or processed text to summarize
   * @returns Concise, high-yield medical summary
   */
  async summarize(text: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a medical education expert.

Summarize the following content with these STRICT rules:
- Do NOT copy sentences directly
- Rewrite everything in your own words
- Keep only the most important ideas
- Reduce length to 30% of original
- Make it concise and high-yield for exam revision
- Use bullet points where helpful
"Explain this like you are teaching a student who has only 5 minutes to revise before exam."`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const result = await this.getCompletion({
      messages,
      temperature: 0.3,
      maxTokens: 1000,
    });

    return result.content;
  }

  /**
   * Format raw OCR text into structured medical notes
   * @param text - Raw OCR output from Textract/Tesseract
   * @returns Well-structured Markdown notes
   */
  async formatNotes(text: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a professional medical editor. Format the following raw OCR text into well-structured Markdown notes. Use clear headings (H1, H2, H3), bullet points, and tables where appropriate. Correct obvious OCR typos while preserving accurate medical terminology and names. \n\nCRITICAL: If the content describes a biological process, anatomical hierarchy, or a clinical diagnostic algorithm, include a Mermaid.js diagram block (e.g., ```mermaid\n flowchart TD ... ```). Keep diagrams simple, high-yield, and accurate.',
      },
      {
        role: 'user',
        content: text,
      },
    ];

    const result = await this.getCompletion({
      messages,
      temperature: 0.1, // Low temperature for factual formatting
      maxTokens: 4000,
    });

    return result.content;
  }
}

export const llmService = new LLMService();
