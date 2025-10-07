import { Router } from 'express';
import { authenticateJWT, authorize } from '../utils/authMiddleware';
import {
  createSubmissionHandler,
  deleteSubmissionHandler,
  getSubmissionHandler,
  listProjectSubmissionsHandler,
  updateSubmissionStatusHandler
} from '../controllers/submissionController';
import { addCommentHandler, listCommentsHandler } from '../controllers/commentController';

const router = Router();

// Create submission
router.post('/', authenticateJWT, createSubmissionHandler);

// View single submission
router.get('/:id', authenticateJWT, getSubmissionHandler);

// Nested comments on submissions
router.post('/:id/comments', authenticateJWT, authorize(['reviewer']), addCommentHandler);
router.get('/:id/comments', authenticateJWT, listCommentsHandler);

// Update submission status (reviewer only)
router.patch('/:id/status', authenticateJWT, authorize(['reviewer']), updateSubmissionStatusHandler);

// Delete submission (reviewer only)
router.delete('/:id', authenticateJWT, authorize(['reviewer']), deleteSubmissionHandler);

export default router;