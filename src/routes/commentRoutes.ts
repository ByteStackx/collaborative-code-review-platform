import { Router } from 'express';
import { authenticateJWT, authorize } from '../utils/authMiddleware';
import { addCommentHandler, deleteCommentHandler, listCommentsHandler, updateCommentHandler } from '../controllers/commentController';

const router = Router();

// Nested under submission: create and list
router.post('/submissions/:id/comments', authenticateJWT, authorize(['reviewer']), addCommentHandler);
router.get('/submissions/:id/comments', authenticateJWT, listCommentsHandler);

// Standalone comment operations
router.patch('/comments/:id', authenticateJWT, authorize(['reviewer']), updateCommentHandler);
router.delete('/comments/:id', authenticateJWT, authorize(['reviewer']), deleteCommentHandler);

export default router;
