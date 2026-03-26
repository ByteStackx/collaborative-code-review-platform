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
import { approveSubmissionHandler, listReviewsHandler, requestChangesHandler } from '../controllers/reviewController';

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

// Review workflow
router.post('/:id/approve', authenticateJWT, authorize(['reviewer']), approveSubmissionHandler);
router.post('/:id/request-changes', authenticateJWT, authorize(['reviewer']), requestChangesHandler);
router.get('/:id/reviews', authenticateJWT, listReviewsHandler);

// Delete submission (reviewer only)
router.delete('/:id', authenticateJWT, authorize(['reviewer']), deleteSubmissionHandler);

export default router;