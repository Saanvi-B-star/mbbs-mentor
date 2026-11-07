/**
 * Memory Service
 * Handles chat history persistence using Prisma
 */

import { logger } from '@/config/logger';
import { prisma } from '@/config/database';
import { ChatHistory, ChatRequestClaim, ChatResponse, SaveChatParams } from '../llm.types';
import { ConflictException } from '@/shared/exceptions';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

const CHAT_REQUEST_LEASE_MS = 35 * 60 * 1000;

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

  async saveChatInTransaction(
    tx: Prisma.TransactionClient,
    params: SaveChatParams
  ): Promise<ChatHistory> {
    const { userId, question, response } = params;
    return tx.llmChat.create({
      data: { userId: userId || null, question, response },
    });
  }

  async claimChatRequest(
    userId: string,
    idempotencyKey: string,
    requestHash: string
  ): Promise<ChatRequestClaim> {
    const claimToken = randomUUID();
    const leaseExpiresAt = new Date(Date.now() + CHAT_REQUEST_LEASE_MS);
    try {
      const request = await prisma.llmChatRequest.create({
        data: { userId, idempotencyKey, requestHash, claimToken, leaseExpiresAt },
      });
      return { status: 'claimed', id: request.id, claimToken };
    } catch (createError) {
      const existing = await prisma.llmChatRequest.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
      });
      if (!existing) {
        throw createError;
      }
      if (existing.requestHash !== requestHash) {
        throw new ConflictException('Idempotency key was already used for a different request');
      }
      if (existing.status === 'COMPLETED' && existing.response) {
        return { status: 'completed', response: this.parseChatResponse(existing.response) };
      }
      const now = new Date();
      if (
        existing.status === 'PROCESSING' &&
        existing.leaseExpiresAt &&
        existing.leaseExpiresAt <= now
      ) {
        const takeover = await prisma.llmChatRequest.updateMany({
          where: {
            id: existing.id,
            status: 'PROCESSING',
            claimToken: existing.claimToken,
            leaseExpiresAt: { lte: now },
          },
          data: { claimToken, leaseExpiresAt },
        });
        if (takeover.count === 1) {
          return { status: 'claimed', id: existing.id, claimToken };
        }
      }
      throw new ConflictException('A request with this idempotency key is still in progress');
    }
  }

  async completeChatRequestInTransaction(
    tx: Prisma.TransactionClient,
    requestId: string,
    claimToken: string,
    chatId: string,
    response: ChatResponse
  ): Promise<void> {
    const updated = await tx.llmChatRequest.updateMany({
      where: { id: requestId, status: 'PROCESSING', claimToken },
      data: {
        status: 'COMPLETED',
        chatId,
        response: JSON.stringify(response),
        leaseExpiresAt: null,
      },
    });
    if (updated.count !== 1) {
      throw new ConflictException('Chat request ownership changed before completion');
    }
  }

  async releaseChatRequest(requestId: string, claimToken: string): Promise<void> {
    try {
      await prisma.llmChatRequest.deleteMany({
        where: { id: requestId, status: 'PROCESSING', claimToken },
      });
    } catch (error) {
      logger.error('Failed to release incomplete chat idempotency record:', error);
      throw error;
    }
  }

  private parseChatResponse(serializedResponse: string): ChatResponse {
    const response: unknown = JSON.parse(serializedResponse);
    if (
      typeof response !== 'object' ||
      response === null ||
      !('answer' in response) ||
      typeof response.answer !== 'string' ||
      !('tokensUsed' in response) ||
      (typeof response.tokensUsed !== 'number' && response.tokensUsed !== null) ||
      !('model' in response) ||
      typeof response.model !== 'string' ||
      !('sources' in response) ||
      !Array.isArray(response.sources)
    ) {
      throw new Error('Stored chat idempotency response is invalid.');
    }
    return response as ChatResponse;
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
    await prisma.$transaction(async (tx) => {
      await tx.llmChat.deleteMany({ where: { userId } });
      await tx.llmChatRequest.deleteMany({ where: { userId, status: 'COMPLETED' } });
    });
  }
}

export const memoryService = new MemoryService();
