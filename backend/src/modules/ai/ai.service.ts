import { prisma } from '@/config';
import { openRouterClient } from './openrouter.client';
import { tokenService } from '../token/token.service';
import {
  AIChatDto,
  AIChatResponse,
  GenerateNotesDto,
  GenerateNotesResponse,
  GenerateSummaryDto,
  GenerateSummaryResponse,
  GenerateFlashcardsDto,
  GenerateFlashcardsResponse,
  Flashcard,
  ConversationQuery,
  AIChatMessage,
} from './ai.types';
import { openRouterConfig } from '@/config/openrouter.config';
import { NotFoundException } from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';
import { logger } from '@/config';

/**
 * AI Service
 * Handles all AI-related business logic
 */
export class AIService {
  /**
   * Chat with AI
   */
  async chat(userId: string, data: AIChatDto): Promise<AIChatResponse> {
    const model = data.model || openRouterConfig.features.chat.model;
    const temperature = data.temperature ?? openRouterConfig.features.chat.temperature;
    const maxTokens = data.maxTokens ?? openRouterConfig.features.chat.maxTokens;

    // Get or create conversation
    let conversation;
    if (data.conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: data.conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10, // Get last 10 messages for context
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }
    } else {
      conversation = await prisma.aIConversation.create({
        data: {
          userId,
          title: data.message.substring(0, 50),
        },
        include: {
          messages: true,
        },
      });
    }

    // Build messages array with conversation history
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an AI tutor specialized in MBBS curriculum. Provide accurate, concise, and helpful medical information. Always cite sources when possible and remind users to consult healthcare professionals for medical advice.',
      },
    ];

    // Add previous messages for context
    if (conversation.messages && conversation.messages.length > 0) {
      conversation.messages.forEach((msg) => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: data.message,
    });

    // Get AI response
    const aiResponse = await openRouterClient.createChatCompletion(messages, {
      model,
      temperature,
      maxTokens,
    });

    const assistantMessage = aiResponse.choices[0].message.content;
    const tokensUsed = aiResponse.usage.total_tokens;
    const cost = openRouterClient.calculateCost(model, tokensUsed);

    // Calculate token cost (convert AI cost to our token system)
    const tokenCost = Math.ceil(cost * 100); // 1 cent = 1 token

    // Deduct tokens
    await tokenService.deductTokens({
      userId,
      amount: tokenCost,
      feature: 'ai_chat',
      referenceId: conversation.id,
      description: `AI Chat (${tokensUsed} AI tokens)`,
    });

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: 'user',
        content: data.message,
      },
    });

    // Save assistant message
    const savedMessage = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: 'assistant',
        content: assistantMessage,
        tokensUsed,
        model,
        aiCost: cost,
      },
    });

    return {
      conversationId: conversation.id,
      messageId: savedMessage.id,
      content: assistantMessage,
      tokensUsed: tokenCost,
      model,
      cost: tokenCost,
    };
  }

  /**
   * Generate notes from content
   */
  async generateNotes(userId: string, data: GenerateNotesDto): Promise<GenerateNotesResponse> {
    const model = openRouterConfig.features.notesProcessing.model;
    const maxTokens = openRouterConfig.features.notesProcessing.maxTokens;
    const temperature = openRouterConfig.features.notesProcessing.temperature;

    const formatInstructions = {
      structured: 'Create well-organized notes with clear headings, subheadings, and bullet points.',
      bullet: 'Create concise bullet-point notes highlighting key concepts.',
      detailed: 'Create comprehensive detailed notes with explanations and examples.',
    };

    const format = data.format || 'structured';
    const systemPrompt = `You are an AI assistant that creates study notes for MBBS students. ${formatInstructions[format]} Focus on clarity, accuracy, and relevance to medical education.`;

    let prompt = `Generate study notes from the following content:\n\n${data.content}`;
    if (data.topic) {
      prompt += `\n\nTopic: ${data.topic}`;
    }

    const response = await openRouterClient.generateText(prompt, systemPrompt, {
      model,
      temperature,
      maxTokens,
    });

    const tokenCost = Math.ceil(openRouterClient.calculateCost(model, response.tokensUsed) * 100);

    // Deduct tokens
    await tokenService.deductTokens({
      userId,
      amount: tokenCost,
      feature: 'generate_notes',
      description: `Notes Generation (${response.tokensUsed} AI tokens)`,
    });

    return {
      notes: response.content,
      tokensUsed: tokenCost,
      cost: tokenCost,
    };
  }

  /**
   * Generate summary
   */
  async generateSummary(
    userId: string,
    data: GenerateSummaryDto
  ): Promise<GenerateSummaryResponse> {
    const model = openRouterConfig.features.summarization.model;
    const maxTokens = data.maxLength || openRouterConfig.features.summarization.maxTokens;
    const temperature = openRouterConfig.features.summarization.temperature;

    const systemPrompt =
      'You are an AI assistant that creates concise summaries of medical content for MBBS students. Focus on key concepts, important facts, and essential takeaways.';

    const prompt = `Summarize the following content in approximately ${maxTokens} tokens:\n\n${data.content}`;

    const response = await openRouterClient.generateText(prompt, systemPrompt, {
      model,
      temperature,
      maxTokens,
    });

    const tokenCost = Math.ceil(openRouterClient.calculateCost(model, response.tokensUsed) * 100);

    // Deduct tokens
    await tokenService.deductTokens({
      userId,
      amount: tokenCost,
      feature: 'generate_summary',
      description: `Summary Generation (${response.tokensUsed} AI tokens)`,
    });

    return {
      summary: response.content,
      tokensUsed: tokenCost,
      cost: tokenCost,
    };
  }

  /**
   * Generate flashcards
   */
  async generateFlashcards(
    userId: string,
    data: GenerateFlashcardsDto
  ): Promise<GenerateFlashcardsResponse> {
    const model = openRouterConfig.features.flashcardGeneration.model;
    const maxTokens = openRouterConfig.features.flashcardGeneration.maxTokens;
    const temperature = openRouterConfig.features.flashcardGeneration.temperature;
    const count = data.count || 10;

    const systemPrompt = `You are an AI assistant that creates flashcards for MBBS students. Generate ${count} flashcards in JSON format. Each flashcard should have "question", "answer", and optionally "hint" fields. Return only valid JSON array.`;

    let prompt = `Create ${count} flashcards from the following content:\n\n${data.content}`;
    if (data.topic) {
      prompt += `\n\nTopic: ${data.topic}`;
    }

    const response = await openRouterClient.generateText(prompt, systemPrompt, {
      model,
      temperature,
      maxTokens,
    });

    // Parse flashcards from response
    let flashcards: Flashcard[];
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: parse manually if JSON not found
        flashcards = this.parseFlashcardsFromText(response.content);
      }
    } catch (error) {
      logger.error('Failed to parse flashcards', { error });
      flashcards = this.parseFlashcardsFromText(response.content);
    }

    const tokenCost = Math.ceil(openRouterClient.calculateCost(model, response.tokensUsed) * 100);

    // Deduct tokens
    await tokenService.deductTokens({
      userId,
      amount: tokenCost,
      feature: 'generate_flashcards',
      description: `Flashcard Generation (${response.tokensUsed} AI tokens)`,
    });

    return {
      flashcards,
      tokensUsed: tokenCost,
      cost: tokenCost,
    };
  }

  /**
   * Get conversations
   */
  async getConversations(userId: string, query: ConversationQuery) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.aIConversation.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.aIConversation.count({ where: { userId } }),
    ]);

    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      messageCount: conv._count.messages,
      lastMessage: conv.messages[0]?.content,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return {
      conversations: formattedConversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get conversation by ID
   */
  async getConversation(userId: string, conversationId: string) {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return conversation;
  }

  /**
   * Delete conversation
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    await prisma.aIConversation.delete({
      where: { id: conversationId },
    });
  }

  // Helper method to parse flashcards from text when JSON parsing fails
  private parseFlashcardsFromText(text: string): Flashcard[] {
    const flashcards: Flashcard[] = [];
    const lines = text.split('\n');
    let currentCard: Partial<Flashcard> = {};

    for (const line of lines) {
      if (line.toLowerCase().includes('question:')) {
        if (currentCard.question && currentCard.answer) {
          flashcards.push(currentCard as Flashcard);
        }
        currentCard = { question: line.replace(/question:/i, '').trim() };
      } else if (line.toLowerCase().includes('answer:')) {
        currentCard.answer = line.replace(/answer:/i, '').trim();
      } else if (line.toLowerCase().includes('hint:')) {
        currentCard.hint = line.replace(/hint:/i, '').trim();
      }
    }

    if (currentCard.question && currentCard.answer) {
      flashcards.push(currentCard as Flashcard);
    }

    return flashcards;
  }
}

export const aiService = new AIService();
