/**
 * AI Module Types
 */

/**
 * AI Chat Message
 */
export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * AI Chat Request DTO
 */
export interface AIChatDto {
  message: string;
  conversationId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI Chat Response
 */
export interface AIChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  tokensUsed: number;
  model: string;
  cost: number;
}

/**
 * Generate Notes DTO
 */
export interface GenerateNotesDto {
  content: string;
  topic?: string;
  format?: 'structured' | 'bullet' | 'detailed';
}

/**
 * Generate Notes Response
 */
export interface GenerateNotesResponse {
  notes: string;
  tokensUsed: number;
  cost: number;
}

/**
 * Generate Summary DTO
 */
export interface GenerateSummaryDto {
  content: string;
  maxLength?: number;
}

/**
 * Generate Summary Response
 */
export interface GenerateSummaryResponse {
  summary: string;
  tokensUsed: number;
  cost: number;
}

/**
 * Generate Flashcards DTO
 */
export interface GenerateFlashcardsDto {
  content: string;
  count?: number;
  topic?: string;
}

/**
 * Flashcard
 */
export interface Flashcard {
  question: string;
  answer: string;
  hint?: string;
}

/**
 * Generate Flashcards Response
 */
export interface GenerateFlashcardsResponse {
  flashcards: Flashcard[];
  tokensUsed: number;
  cost: number;
}

/**
 * Conversation DTO
 */
export interface ConversationDto {
  id: string;
  title?: string | null;
  messageCount: number;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conversation History Query
 */
export interface ConversationQuery {
  page?: number;
  limit?: number;
}

/**
 * AI Request Metadata
 */
export interface AIRequestMetadata {
  feature: string;
  model: string;
  temperature: number;
  maxTokens: number;
  estimatedCost: number;
}
