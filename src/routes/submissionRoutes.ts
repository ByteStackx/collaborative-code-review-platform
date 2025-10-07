import { Router } from 'express';
import { authenticateJWT, authorize } from '../utils/authMiddleware';
import {
  createSubmissionHandler,
  deleteSubmissionHandler,
  getSubmissionHandler,
  listProjectSubmissionsHandler,
  updateSubmissionStatusHandler
} from '../controllers/submissionController';

const router = Router();

// Create submission
router.post('/', authenticateJWT, createSubmissionHandler);

// View single submission
router.get('/:id', authenticateJWT, getSubmissionHandler);

// Update submission status (reviewer only)
router.patch('/:id/status', authenticateJWT, authorize(['reviewer']), updateSubmissionStatusHandler);

// Delete submission (reviewer only)
router.delete('/:id', authenticateJWT, authorize(['reviewer']), deleteSubmissionHandler);

export default router;
