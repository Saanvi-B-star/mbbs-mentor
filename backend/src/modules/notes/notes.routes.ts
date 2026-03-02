import { Router } from 'express';
import multer from 'multer';
import { notesController } from './notes.controller';
import { authMiddleware, validateParams, validateBody } from '@/middleware';
import { uploadRateLimiter } from '@/middleware';
import {
  updateNoteSchema,
  getNoteSchema,
  deleteNoteSchema,
  generateFlashcardsSchema,
  extractByTagsSchema,
  extractByDateRangeSchema,
  extractByStatusSchema,
  extractByTopicSchema,
  extractBySubjectSchema,
  getNotesBySubjectTreeSchema,
} from './notes.validation';

/**
 * Notes Routes
 */
const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, JPG allowed.'));
    }
  },
});

/**
 * All routes require authentication
 */

// Upload note
router.post(
  '/upload',
  authMiddleware,
  uploadRateLimiter,
  upload.single('file'),
  notesController.uploadNote.bind(notesController)
);

/**
 * @swagger
 * /api/v1/notes:
 *   get:
 *     summary: Get all user notes
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notes
 */

// Get user's notes
router.get('/', authMiddleware, notesController.getUserNotes.bind(notesController));

// Get note statistics
router.get(
  '/statistics',
  authMiddleware,
  notesController.getNoteStatistics.bind(notesController)
);

// Export notes
router.get(
  '/export',
  authMiddleware,
  notesController.exportNotes.bind(notesController)
);

// Search notes
router.get(
  '/extract/search',
  authMiddleware,
  notesController.searchNotes.bind(notesController)
);

// Extract processed notes
router.get(
  '/extract/processed',
  authMiddleware,
  notesController.getProcessedNotes.bind(notesController)
);

// Extract by tags
router.post(
  '/extract/by-tags',
  authMiddleware,
  validateBody(extractByTagsSchema.shape.body),
  notesController.extractByTags.bind(notesController)
);

// Extract by date range
router.post(
  '/extract/by-date',
  authMiddleware,
  validateBody(extractByDateRangeSchema.shape.body),
  notesController.extractByDateRange.bind(notesController)
);

// Extract by status
router.get(
  '/extract/by-status/:status',
  authMiddleware,
  validateParams(extractByStatusSchema.shape.params),
  notesController.extractByStatus.bind(notesController)
);

// Extract notes by topic
router.get(
  '/by-topic/:topicId',
  authMiddleware,
  validateParams(extractByTopicSchema.shape.params),
  notesController.extractByTopic.bind(notesController)
);

// Extract notes by subject
router.get(
  '/by-subject/:subjectId',
  authMiddleware,
  validateParams(extractBySubjectSchema.shape.params),
  notesController.extractBySubject.bind(notesController)
);

// Get notes organized by topics within a subject (tree structure)
router.get(
  '/tree/subject/:subjectId',
  authMiddleware,
  validateParams(getNotesBySubjectTreeSchema.shape.params),
  notesController.getNotesBySubjectTree.bind(notesController)
);

// Get notes organized by all subjects and topics (full hierarchy)
router.get(
  '/tree/all',
  authMiddleware,
  notesController.getNotesBySubjectsTree.bind(notesController)
);

// Get note by ID (must be after other routes to avoid conflicts)
router.get(
  '/:id',
  authMiddleware,
  validateParams(getNoteSchema.shape.params),
  notesController.getNoteById.bind(notesController)
);

// Update note
router.patch(
  '/:id',
  authMiddleware,
  validateParams(updateNoteSchema.shape.params),
  validateBody(updateNoteSchema.shape.body),
  notesController.updateNote.bind(notesController)
);

// Delete note
router.delete(
  '/:id',
  authMiddleware,
  validateParams(deleteNoteSchema.shape.params),
  notesController.deleteNote.bind(notesController)
);

// Generate flashcards from note
router.post(
  '/:id/flashcards',
  authMiddleware,
  validateParams(generateFlashcardsSchema.shape.params),
  validateBody(generateFlashcardsSchema.shape.body),
  notesController.generateFlashcards.bind(notesController)
);

export { router as notesRoutes };
