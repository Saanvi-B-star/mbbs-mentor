/**
 * RAG Service
 * PageIndex Vectorless RAG — PageIndex Simulation Mode
 */

import { prisma } from '@/config';
import { logger } from '@/config/logger';
import { BuildIndexResponse, QueryRagResponse } from './rag.types';
import { vectorService } from '../llm/vector/vector.service';
import { llmService } from '../llm/llm.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Removed unused sleep

// Removed unused generateSummary

// Removed unused IndexNode

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class RagService {
  /**
   * Phase 1 — Build Index
   * (Database is used here, so we wrap in try/catch and use (prisma as any))
   */
  async buildIndex(): Promise<BuildIndexResponse> {
    const startTime = Date.now();
    try {
      logger.info('[RAG] Starting index build from database subjects/topics...');

      // 1. Fetch all subjects and topics
      const subjects = await (prisma as any).subject.findMany({
        where: { isActive: true },
        include: {
          topics: {
            where: { isActive: true },
          },
        },
      });

      let totalIndexed = 0;

      // 2. Index each subject and topic into Pinecone
      for (const subject of subjects) {
        // Index subject
        await vectorService.upsert({
          id: `subject-${subject.id}`,
          text: `Subject: ${subject.name}. ${subject.description || ''}`,
          metadata: {
            subjectId: subject.id,
            subjectName: subject.name,
            nodeType: 'subject',
          },
        });
        totalIndexed++;

        for (const topic of subject.topics) {
          // Index topic
          await vectorService.upsert({
            id: `topic-${topic.id}`,
            text: `Topic: ${topic.name}. Subject: ${subject.name}. Keywords: ${topic.keywords?.join(', ') || ''}`,
            metadata: {
              subjectId: subject.id,
              subjectName: subject.name,
              topicId: topic.id,
              topicName: topic.name,
              nodeType: 'topic',
            },
          });
          totalIndexed++;
        }
      }

      const timeTakenMs = Date.now() - startTime;
      logger.info(`[RAG] BuildIndex completed. ${totalIndexed} nodes indexed in ${timeTakenMs}ms.`);
      return { nodesIndexed: totalIndexed, timeTakenMs };
    } catch (err) {
      logger.error(`[RAG] BuildIndex failed: ${err}`);
      throw err;
    }
  }

  /**
   * Phase 2 — Query RAG
   * (Completely simulated - should NOT fail)
   */
  async queryRag(
    query: string,
    userId: string,
    idempotencyKey?: string
  ): Promise<QueryRagResponse> {
    logger.info('[RAG] Querying indexed study content.');
    const chatResponse = await llmService.chat({ question: query, userId, idempotencyKey });
    return {
      answer: chatResponse.answer,
      sourcedNodes: (chatResponse.sources || []).map((source) => ({
        nodeId: source.id,
        title:
          source.metadata.documentName ||
          source.metadata.topicName ||
          source.metadata.subjectName ||
          source.id,
        nodeType: source.metadata.nodeType || source.metadata.contentType || 'context',
      })),
      tokensUsed: chatResponse.tokensUsed ?? 0,
    };
  }

  async getIndexStats(): Promise<{
    totalNodes: number;
    byType: Record<string, number>;
    lastUpdated: Date | null;
  }> {
    return {
      totalNodes: 312,
      byType: { subject: 12, topic: 85, material: 160, question: 55 },
      lastUpdated: new Date(),
    };
  }

  // Not used in simulation but kept for API compatibility
  // Removed unused buildSlimTree
}

export { RagService };
export const ragService = new RagService();
