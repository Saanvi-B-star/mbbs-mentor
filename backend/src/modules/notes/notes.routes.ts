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
  fileFilter: (req, file, cb) => {
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

// Get user's notes
router.get('/', authMiddleware, notesController.getUserNotes.bind(notesController));

// Get note by ID
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
