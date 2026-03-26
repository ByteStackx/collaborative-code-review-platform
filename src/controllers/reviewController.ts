import { Request, Response } from 'express';
import { addReview, listReviewsBySubmission, reviewerCanReview, setSubmissionStatusReviewed } from '../services/reviewService';

export async function approveSubmissionHandler(req: Request, res: Response) {
  const role = req.user?.role as 'submitter' | 'reviewer' | undefined;
  const userId = req.user?.sub as string | undefined;
  if (!role || !userId) return res.status(401).json({ message: 'Unauthorized' });
  if (role !== 'reviewer') return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params as { id: string };
  const { comment } = req.body || {};
  const perm = await reviewerCanReview(userId, id);
  if (!perm.ok) return res.status(perm.code!).json({ message: perm.message });
  const review = await addReview(id, userId, 'approved', comment);
  const updated = await setSubmissionStatusReviewed(id, 'approved');
  return res.status(201).json({ review, submission: updated });
}

export async function requestChangesHandler(req: Request, res: Response) {
  const role = req.user?.role as 'submitter' | 'reviewer' | undefined;
  const userId = req.user?.sub as string | undefined;
  if (!role || !userId) return res.status(401).json({ message: 'Unauthorized' });
  if (role !== 'reviewer') return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params as { id: string };
  const { comment } = req.body || {};
  const perm = await reviewerCanReview(userId, id);
  if (!perm.ok) return res.status(perm.code!).json({ message: perm.message });
  const review = await addReview(id, userId, 'changes_requested', comment);
  const updated = await setSubmissionStatusReviewed(id, 'changes_requested');
  return res.status(201).json({ review, submission: updated });
}

export async function listReviewsHandler(req: Request, res: Response) {
  const userId = req.user?.sub as string | undefined;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params as { id: string };
  // Ensure membership to read review history
  const perm = await reviewerCanReview(userId, id);
  if (!perm.ok && perm.code !== 403) {
    // If 404, propagate; if 403, we still forbid for non-members
    return res.status(perm.code!).json({ message: perm.message });
  }
  if (perm.code === 403) return res.status(403).json({ message: 'Not a member of this project' });
  const reviews = await listReviewsBySubmission(id);
  return res.json(reviews);
}
