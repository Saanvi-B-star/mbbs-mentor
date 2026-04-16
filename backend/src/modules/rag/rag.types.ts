/**
 * RAG Module Types
 */

export interface RagNode {
  nodeId: string;
  nodeType: 'subject' | 'topic' | 'material' | 'question';
  title: string;
  summary: string;
  content: string;
  parentId?: string;
  metadata?: Record<string, any>;
  children?: RagNode[];
}

export interface RagTreeSlim {
  nodeId: string;
  title: string;
  summary: string;
  nodeType: string;
  children?: RagTreeSlim[];
}

export interface QueryRagRequest {
  query: string;
  conversationId?: string;
}

export interface QueryRagResponse {
  answer: string;
  sourcedNodes: { nodeId: string; title: string; nodeType: string }[];
  tokensUsed?: number;
}

export interface BuildIndexResponse {
  nodesIndexed: number;
  timeTakenMs: number;
}
