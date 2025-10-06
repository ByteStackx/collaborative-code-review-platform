import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile } from '../controllers/userController';
import { authenticateJWT, authorize, requireSelfOrReviewer } from '../utils/authMiddleware';

const router = Router();

router.get('/:id', authenticateJWT, requireSelfOrReviewer(), getProfile);
router.put('/:id', authenticateJWT, requireSelfOrReviewer(), updateProfile);
router.delete('/:id', authenticateJWT, authorize(['reviewer']), deleteProfile);

export default router;
