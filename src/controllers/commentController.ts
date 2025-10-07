import { Request, Response } from 'express';
import { createComment, deleteComment, ensureReviewerAndMember, getCommentById, listCommentsBySubmission, updateComment } from '../services/commentService';
import { getSubmissionById, isUserMemberOfProject } from '../services/submissionService';

export async function addCommentHandler(req: Request, res: Response) {
  const userId = req.user?.sub as string | undefined;
  const role = req.user?.role as 'submitter' | 'reviewer' | undefined;
  if (!userId || !role) return res.status(401).json({ message: 'Unauthorized' });
  const { id: submissionId } = req.params as { id: string };
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ message: 'content is required' });
  const perm = await ensureReviewerAndMember(userId, submissionId, role);
  if (!perm.ok) return res.status(perm.code).json({ message: perm.message });
  const comment = await createComment(submissionId, userId, content);
  return res.status(201).json(comment);
}

export async function listCommentsHandler(req: Request, res: Response) {
  const userId = req.user?.sub as string | undefined;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { id: submissionId } = req.params as { id: string };
  const sub = await getSubmissionById(submissionId);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });
  // Reuse membership check from commentService indirectly via submissionService helper
  // We allow any project member to read comments
  // If project_members missing, fallback to project creator
  const ok = await isUserMemberOfProject(userId, sub.project_id);
  if (!ok) return res.status(403).json({ message: 'Not a member of this project' });
  const comments = await listCommentsBySubmission(submissionId);
  return res.json(comments);
}

export async function updateCommentHandler(req: Request, res: Response) {
  const role = req.user?.role as 'submitter' | 'reviewer' | undefined;
  const userId = req.user?.sub as string | undefined;
  if (!role || !userId) return res.status(401).json({ message: 'Unauthorized' });
  if (role !== 'reviewer') return res.status(403).json({ message: 'Submitters cannot comment' });
  const { id } = req.params as { id: string };
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ message: 'content is required' });
  const existing = await getCommentById(id);
  if (!existing) return res.status(404).json({ message: 'Comment not found' });
  // Ensure the reviewer is a member of the project associated with the submission
  const sub = await getSubmissionById(existing.submission_id);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });
  const ok = await isUserMemberOfProject(userId, sub.project_id);
  if (!ok) return res.status(403).json({ message: 'Not a member of this project' });
  const updated = await updateComment(id, content);
  return res.json(updated);
}

export async function deleteCommentHandler(req: Request, res: Response) {
  const role = req.user?.role as 'submitter' | 'reviewer' | undefined;
  const userId = req.user?.sub as string | undefined;
  if (!role || !userId) return res.status(401).json({ message: 'Unauthorized' });
  if (role !== 'reviewer') return res.status(403).json({ message: 'Submitters cannot comment' });
  const { id } = req.params as { id: string };
  const existing = await getCommentById(id);
  if (!existing) return res.status(404).json({ message: 'Comment not found' });
  const sub = await getSubmissionById(existing.submission_id);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });
  const ok = await isUserMemberOfProject(userId, sub.project_id);
  if (!ok) return res.status(403).json({ message: 'Not a member of this project' });
  await deleteComment(id);
  return res.status(204).send();
}
