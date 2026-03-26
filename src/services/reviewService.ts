import { query } from '../config/db';
import { getSubmissionById, isUserMemberOfProject, updateSubmissionStatus, SubmissionStatus } from './submissionService';

export type ReviewAction = 'approved' | 'changes_requested';

export type SubmissionReview = {
  id: string;
  submission_id: number;
  reviewer_id: string;
  action: ReviewAction;
  comment: string | null;
  created_at: Date;
};

export async function ensureReviewsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS submission_reviews (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE,
      reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT CHECK (action IN ('approved','changes_requested')) NOT NULL,
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS submission_reviews_submission_idx ON submission_reviews(submission_id);`);
}

export async function addReview(submissionId: string, reviewerId: string, action: ReviewAction, comment?: string): Promise<SubmissionReview> {
  const result = await query(
    `INSERT INTO submission_reviews (submission_id, reviewer_id, action, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING id, submission_id, reviewer_id, action, comment, created_at`,
    [submissionId, reviewerId, action, comment ?? null]
  );
  return result.rows[0];
}

export async function listReviewsBySubmission(submissionId: string): Promise<SubmissionReview[]> {
  const result = await query(
    `SELECT id, submission_id, reviewer_id, action, comment, created_at
     FROM submission_reviews
     WHERE submission_id = $1
     ORDER BY created_at DESC`,
    [submissionId]
  );
  return result.rows;
}

export async function reviewerCanReview(userId: string, submissionId: string): Promise<{ ok: boolean; code?: number; message?: string; projectId?: string; }> {
  const sub = await getSubmissionById(submissionId);
  if (!sub) return { ok: false, code: 404, message: 'Submission not found' };
  const member = await isUserMemberOfProject(userId, sub.project_id);
  if (!member) return { ok: false, code: 403, message: 'Not a member of this project' };
  return { ok: true, projectId: sub.project_id };
}

export async function setSubmissionStatusReviewed(submissionId: string, status: SubmissionStatus) {
  return updateSubmissionStatus(submissionId, status);
}
