/**
 * LLM Module Types
 * Type definitions for RAG chatbot
 */

// ==================== REQUEST/RESPONSE ====================

export interface ChatRequest {
  question: string;
  userId?: string;
}

export interface ChatResponse {
  answer: string;
  tokensUsed: number | null;
  model: string;
  sources?: VectorMatch[];
}

// ==================== VECTOR TYPES ====================

export interface VectorMetadata {
  text: string;
  topicId?: string;
  topicName?: string;
  subjectId?: string;
  subjectName?: string;
  contentType?: string;
  [key: string]: string | undefined;
}

export interface VectorUpsertParams {
  id: string;
  text: string;
  metadata?: Omit<VectorMetadata, 'text'>;
}

export interface VectorMatch {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

export interface VectorSearchResult {
  matches: VectorMatch[];
  query: string;
}

// ==================== LLM TYPES ====================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionParams {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCompletionResult {
  content: string;
  tokensUsed: number | null;
  model: string;
}

// ==================== EMBEDDING TYPES ====================

export interface EmbeddingResult {
  embedding: number[];
  tokensUsed: number;
}

// ==================== MEMORY TYPES ====================

export interface SaveChatParams {
  userId?: string;
  question: string;
  response: string;
}

export interface ChatHistory {
  id: string;
  userId: string | null;
  question: string;
  response: string;
  createdAt: Date;
}
