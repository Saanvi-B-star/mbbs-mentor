/**
 * RAG Service
 * PageIndex Vectorless RAG — Phase 1: Index Building, Phase 2: Query/Retrieval
 */

import { PrismaClient } from '@prisma/client';
import { openrouterClient } from '@/modules/llm/clients/openrouter.client';
import { logger } from '@/config/logger';
import { BuildIndexResponse, QueryRagResponse, RagTreeSlim } from './rag.types';

const prisma = new PrismaClient();

// Free-tier models (no OpenRouter credits needed)
// TODO: Switch to paid models once OpenRouter credits are loaded:
//   SUMMARY_MODEL = 'google/gemini-2.0-flash-001'
//   ANSWER_MODEL  = 'anthropic/claude-3.5-sonnet:beta'
const SUMMARY_MODEL = 'openai/gpt-oss-20b:free';
const ANSWER_MODEL = 'openai/gpt-oss-20b:free';
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateSummary(content: string): Promise<string> {
  const response = await openrouterClient.chat.completions.create({
    model: SUMMARY_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a concise medical educator. Summarise the following MBBS study content in 2–3 sentences. Be precise and use medical terminology.',
      },
      { role: 'user', content },
    ],
    max_tokens: 256,
    temperature: 0.3,
  });
  return response.choices[0]?.message?.content?.trim() ?? content.slice(0, 300);
}

interface IndexNode {
  nodeId: string;
  nodeType: string;
  title: string;
  content: string;
  parentId?: string;
  metadata?: Record<string, any>;
}

async function processBatch(
  nodes: IndexNode[]
): Promise<{ nodeId: string; summary: string }[]> {
  return Promise.all(
    nodes.map(async (node) => {
      try {
        const summary = await generateSummary(node.content);
        return { nodeId: node.nodeId, summary };
      } catch (err) {
        logger.warn(`RAG: failed to summarise node ${node.nodeId}, using fallback: ${err}`);
        return { nodeId: node.nodeId, summary: node.content.slice(0, 300) };
      }
    })
  );
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class RagService {
  // -------------------------------------------------------------------------
  // Phase 1 — Build Index
  // -------------------------------------------------------------------------

  async buildIndex(): Promise<BuildIndexResponse> {
    const startTime = Date.now();
    logger.info('[RAG] Starting index build...');

    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      include: {
        topics: {
          where: { isActive: true },
          include: {
            studyMaterials: { where: { isActive: true } },
            questions: { where: { isActive: true } },
          },
        },
      },
    });

    logger.info(`[RAG] Found ${subjects.length} active subjects`);

    // Collect all nodes
    const allNodes: IndexNode[] = [];

    for (const subject of subjects) {
      logger.info(`[RAG] Processing subject: ${subject.name} (${subject.topics.length} topics)`);
      allNodes.push({
        nodeId: `subject_${subject.id}`,
        nodeType: 'subject',
        title: subject.name,
        content: [subject.name, subject.description ?? ''].join(' ').trim(),
        metadata: { subjectCode: subject.code, mbbsYear: subject.mbbsYear },
      });

      for (const topic of subject.topics) {
        allNodes.push({
          nodeId: `topic_${topic.id}`,
          nodeType: 'topic',
          title: topic.name,
          content: [topic.name, topic.description ?? ''].join(' ').trim(),
          parentId: `subject_${subject.id}`,
          metadata: {
            subjectCode: subject.code,
            mbbsYear: subject.mbbsYear,
            difficultyLevel: topic.difficultyLevel,
          },
        });

        for (const material of topic.studyMaterials) {
          const rawContent = [material.title, material.content ?? material.summary ?? '']
            .join('\n')
            .trim();
          if (!rawContent || rawContent === material.title) continue; // skip if no useful content
          allNodes.push({
            nodeId: `material_${material.id}`,
            nodeType: 'material',
            title: material.title,
            content: rawContent,
            parentId: `topic_${topic.id}`,
            metadata: {
              subjectCode: subject.code,
              mbbsYear: subject.mbbsYear,
              materialType: material.materialType,
            },
          });
        }

        for (const question of topic.questions) {
          if (!question.explanation) continue; // skip if no explanation
          allNodes.push({
            nodeId: `question_${question.id}`,
            nodeType: 'question',
            title: question.questionText.slice(0, 120),
            content: [question.questionText, question.explanation].join('\n').trim(),
            parentId: `topic_${topic.id}`,
            metadata: {
              subjectCode: subject.code,
              mbbsYear: subject.mbbsYear,
              difficultyLevel: question.difficultyLevel,
              questionType: question.questionType,
            },
          });
        }
      }
    }

    logger.info(`[RAG] Collected ${allNodes.length} nodes (subjects + topics + materials + questions)`);
    logger.info(`[RAG] Generating summaries in batches of ${BATCH_SIZE}...`);

    let summaryMap: Record<string, string> = {};
    for (let i = 0; i < allNodes.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allNodes.length / BATCH_SIZE);
      const batch = allNodes.slice(i, i + BATCH_SIZE);
      logger.info(`[RAG] Summarising batch ${batchNum}/${totalBatches} (nodes ${i + 1}–${i + batch.length})`);
      const results = await processBatch(batch);
      for (const r of results) summaryMap[r.nodeId] = r.summary;
      if (i + BATCH_SIZE < allNodes.length) await sleep(BATCH_DELAY_MS);
    }
    logger.info('[RAG] All summaries generated, upserting into DB...');

    // Upsert all nodes
    let nodesIndexed = 0;
    for (const node of allNodes) {
      await prisma.ragIndex.upsert({
        where: { nodeId: node.nodeId },
        update: {
          title: node.title,
          summary: summaryMap[node.nodeId] ?? '',
          content: node.content,
          parentId: node.parentId ?? null,
          metadata: node.metadata ?? {},
        },
        create: {
          nodeId: node.nodeId,
          nodeType: node.nodeType,
          title: node.title,
          summary: summaryMap[node.nodeId] ?? '',
          content: node.content,
          parentId: node.parentId ?? null,
          metadata: node.metadata ?? {},
        },
      });
      nodesIndexed++;
    }

    const timeTakenMs = Date.now() - startTime;
    logger.info(`[RAG] Index build complete — ${nodesIndexed} nodes indexed in ${timeTakenMs}ms`);
    return { nodesIndexed, timeTakenMs };
  }

  // -------------------------------------------------------------------------
  // Phase 2 — Query RAG
  // -------------------------------------------------------------------------

  async queryRag(query: string): Promise<QueryRagResponse> {
    // Load all slim nodes
    const allRows = await prisma.ragIndex.findMany({
      select: { nodeId: true, nodeType: true, title: true, summary: true, parentId: true },
    });

    if (allRows.length === 0) {
      return {
        answer:
          'The knowledge index is empty. Please ask an administrator to run the index build first.',
        sourcedNodes: [],
      };
    }

    // Build slim tree
    const slimTree = this.buildSlimTree(allRows);

    // Phase 2a — tree traversal
    const traversalPrompt = `You are a medical education AI assistant for MBBS students.
Given this hierarchical index of medical study content (titles and summaries only),
and the student's question, return a JSON array of nodeIds that most likely contain the answer.
Reason about the medical subject domain to find the most relevant nodes.
Return ONLY a raw JSON array like: ["nodeId1", "nodeId2"]

Index Tree:
${JSON.stringify(slimTree, null, 2)}

Student Question: ${query}`;

    let selectedNodeIds: string[] = [];
    try {
      const traversalResponse = await openrouterClient.chat.completions.create({
        model: ANSWER_MODEL,
        messages: [{ role: 'user', content: traversalPrompt }],
        max_tokens: 512,
        temperature: 0.2,
      });
      const raw = traversalResponse.choices[0]?.message?.content?.trim() ?? '[]';
      // Strip markdown code fences if present
      const jsonStr = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
      selectedNodeIds = JSON.parse(jsonStr);
      if (!Array.isArray(selectedNodeIds)) selectedNodeIds = [];
    } catch (err) {
      logger.warn(`RAG: tree traversal parse failed, using empty selection: ${err}`);
      selectedNodeIds = [];
    }

    // Fetch full content for selected nodes
    const fullNodes =
      selectedNodeIds.length > 0
        ? await prisma.ragIndex.findMany({
            where: { nodeId: { in: selectedNodeIds } },
            select: { nodeId: true, nodeType: true, title: true, content: true },
          })
        : [];

    const context =
      fullNodes.length > 0
        ? fullNodes.map((n) => `### ${n.title}\n${n.content}`).join('\n\n')
        : 'No specific content found for this query.';

    // Phase 2b — final answer
    const answerPrompt = `You are an expert MBBS medical tutor. Answer the student's question using ONLY the provided context.
If the context doesn't contain enough information, say so clearly.
Be concise, accurate, and use medical terminology appropriately.

Context:
${context}

Student Question: ${query}`;

    const answerResponse = await openrouterClient.chat.completions.create({
      model: ANSWER_MODEL,
      messages: [{ role: 'user', content: answerPrompt }],
      max_tokens: 1024,
      temperature: 0.4,
    });

    const answer =
      answerResponse.choices[0]?.message?.content?.trim() ??
      'I was unable to generate an answer. Please try again.';

    const tokensUsed = answerResponse.usage?.total_tokens ?? undefined;

    return {
      answer,
      sourcedNodes: fullNodes.map((n) => ({
        nodeId: n.nodeId,
        title: n.title,
        nodeType: n.nodeType,
      })),
      tokensUsed,
    };
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  async getIndexStats(): Promise<{
    totalNodes: number;
    byType: Record<string, number>;
    lastUpdated: Date | null;
  }> {
    const rows = await prisma.ragIndex.findMany({
      select: { nodeType: true, updatedAt: true },
    });

    const byType: Record<string, number> = {};
    let lastUpdated: Date | null = null;

    for (const row of rows) {
      byType[row.nodeType] = (byType[row.nodeType] ?? 0) + 1;
      if (!lastUpdated || row.updatedAt > lastUpdated) lastUpdated = row.updatedAt;
    }

    return { totalNodes: rows.length, byType, lastUpdated };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private buildSlimTree(
    rows: { nodeId: string; nodeType: string; title: string; summary: string; parentId: string | null }[]
  ): RagTreeSlim[] {
    const map = new Map<string, RagTreeSlim>();
    const roots: RagTreeSlim[] = [];

    // First pass: build map
    for (const row of rows) {
      map.set(row.nodeId, {
        nodeId: row.nodeId,
        title: row.title,
        summary: row.summary,
        nodeType: row.nodeType,
        children: [],
      });
    }

    // Second pass: wire children
    for (const row of rows) {
      const node = map.get(row.nodeId)!;
      if (row.parentId && map.has(row.parentId)) {
        map.get(row.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}

export { RagService };
export const ragService = new RagService();
