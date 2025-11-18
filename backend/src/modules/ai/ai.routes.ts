import { Router } from 'express';
import { aiController } from './ai.controller';
import { validate, authMiddleware } from '@/middleware';
import { requireTokens } from '@/middleware/token-check.middleware';
import {
  aiChatSchema,
  generateNotesSchema,
  generateSummarySchema,
  generateFlashcardsSchema,
  getConversationSchema,
  getConversationsSchema,
  deleteConversationSchema,
} from './ai.validation';

/**
 * AI Routes
 */
const router = Router();

/**
 * All routes require authentication
 * Some routes also require minimum token balance
 */

// Chat with AI (requires 10 tokens minimum)
router.post(
  '/chat',
  authMiddleware,
  requireTokens(10),
  validate(aiChatSchema),
  aiController.chat.bind(aiController)
);

// Generate notes (requires 20 tokens minimum)
router.post(
  '/generate-notes',
  authMiddleware,
  requireTokens(20),
  validate(generateNotesSchema),
  aiController.generateNotes.bind(aiController)
);

// Generate summary (requires 10 tokens minimum)
router.post(
  '/generate-summary',
  authMiddleware,
  requireTokens(10),
  validate(generateSummarySchema),
  aiController.generateSummary.bind(aiController)
);

// Generate flashcards (requires 15 tokens minimum)
router.post(
  '/generate-flashcards',
  authMiddleware,
  requireTokens(15),
  validate(generateFlashcardsSchema),
  aiController.generateFlashcards.bind(aiController)
);

// Get conversations
router.get(
  '/conversations',
  authMiddleware,
  validate(getConversationsSchema),
  aiController.getConversations.bind(aiController)
);

// Get conversation by ID
router.get(
  '/conversations/:conversationId',
  authMiddleware,
  validate(getConversationSchema),
  aiController.getConversation.bind(aiController)
);

// Delete conversation
router.delete(
  '/conversations/:conversationId',
  authMiddleware,
  validate(deleteConversationSchema),
  aiController.deleteConversation.bind(aiController)
);

export { router as aiRoutes };
