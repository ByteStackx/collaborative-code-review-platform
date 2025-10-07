import { Router } from 'express';
import { addMemberHandler, createProjectHandler, listProjectsHandler, removeMemberHandler } from '../controllers/projectController';
import { listProjectSubmissionsHandler } from '../controllers/submissionController';
import { authenticateJWT, authorize } from '../utils/authMiddleware';

const router = Router();

// Anyone authenticated can list projects
router.get('/', authenticateJWT, listProjectsHandler);

// Authenticated users (submitter or reviewer) can create
router.post('/', authenticateJWT, authorize(['submitter', 'reviewer']), createProjectHandler);

// Reviewer-only membership management
router.post('/:id/members', authenticateJWT, authorize(['reviewer']), addMemberHandler);
router.delete('/:id/members/:userId', authenticateJWT, authorize(['reviewer']), removeMemberHandler);

// List submissions by project (must be a member)
router.get('/:id/submissions', authenticateJWT, listProjectSubmissionsHandler);

export default router;
