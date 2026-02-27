/**
 * Memory Service
 * Handles chat history persistence using Prisma
 */

import { prisma } from '@/config/database';
import { SaveChatParams, ChatHistory } from '../llm.types';

/**
 * Memory Service Class
 */
class MemoryService {
  /**
   * Save a chat interaction
   * @param params - Chat data to save
   * @returns Saved chat record
   */
  async saveChat(params: SaveChatParams): Promise<ChatHistory> {
    const { userId, question, response } = params;

    const chat = await prisma.llmChat.create({
      data: {
        userId: userId || null,
        question,
        response,
      },
    });

    return chat;
  }

  /**
   * Get chat history for a user
   * @param userId - User ID
   * @param limit - Maximum number of chats to return
   * @returns Array of chat records
   */
  async getChatHistory(userId: string, limit: number = 20): Promise<ChatHistory[]> {
    const chats = await prisma.llmChat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return chats;
  }

  /**
   * Get recent chats for context (optional for multi-turn conversations)
   * @param userId - User ID
   * @param limit - Number of recent chats
   * @returns Formatted chat history
   */
  async getRecentContext(
    userId: string,
    limit: number = 3
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const chats = await prisma.llmChat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Reverse to get chronological order
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    
    for (const chat of chats.reverse()) {
      history.push({ role: 'user', content: chat.question });
      history.push({ role: 'assistant', content: chat.response });
    }

    return history;
  }

  /**
   * Delete chat history for a user
   * @param userId - User ID
   */
  async deleteChatHistory(userId: string): Promise<void> {
    await prisma.llmChat.deleteMany({
      where: { userId },
    });
  }
}

export const memoryService = new MemoryService();
