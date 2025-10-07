import { Request, Response } from 'express';
import {
  createSubmission,
  deleteSubmission,
  getSubmissionById,
  isUserMemberOfProject,
  listSubmissionsByProject,
  projectExists,
  updateSubmissionStatus,
  SubmissionStatus
} from '../services/submissionService';

export async function createSubmissionHandler(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { projectId, title, content } = req.body || {};
  if (!projectId || !title || !content) {
    return res.status(400).json({ message: 'projectId, title and content are required' });
  }
  if (!(await projectExists(projectId))) return res.status(404).json({ message: 'Project not found' });
  // Require submitter to be a member or creator of the project
  const ok = await isUserMemberOfProject(userId, projectId);
  if (!ok) return res.status(403).json({ message: 'Not a member of this project' });
  const submission = await createSubmission(projectId, userId, title, content);
  return res.status(201).json(submission);
}

export async function listProjectSubmissionsHandler(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { id: projectId } = req.params as { id: string };
  if (!(await projectExists(projectId))) return res.status(404).json({ message: 'Project not found' });
  const ok = await isUserMemberOfProject(userId, projectId);
  if (!ok) return res.status(403).json({ message: 'Not a member of this project' });
  const submissions = await listSubmissionsByProject(projectId);
  return res.json(submissions);
}

export async function getSubmissionHandler(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params as { id: string };
  const sub = await getSubmissionById(id);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });
  const ok = await isUserMemberOfProject(userId, sub.project_id);
  if (!ok) return res.status(403).json({ message: 'Not a member of this project' });
  return res.json(sub);
}

export async function updateSubmissionStatusHandler(req: Request, res: Response) {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ message: 'Unauthorized' });
  if (role !== 'reviewer') return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params as { id: string };
  const { status } = req.body as { status?: SubmissionStatus };
  if (!status) return res.status(400).json({ message: 'status is required' });
  const updated = await updateSubmissionStatus(id, status);
  if (!updated) return res.status(404).json({ message: 'Submission not found' });
  return res.json(updated);
}

export async function deleteSubmissionHandler(req: Request, res: Response) {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ message: 'Unauthorized' });
  if (role !== 'reviewer') return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params as { id: string };
  const sub = await getSubmissionById(id);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });
  await deleteSubmission(id);
  return res.status(204).send();
}
