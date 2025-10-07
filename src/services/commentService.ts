import { query } from '../config/db';
import { getSubmissionById } from './submissionService';
import { isUserMemberOfProject } from './submissionService';

export type Comment = {
  id: string;
  submission_id: string;
  user_id: string | null;
  content: string;
  created_at: Date;
  updated_at: Date;
};

export async function ensureCommentsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS comments_submission_idx ON comments(submission_id);`);
}

export async function createComment(submissionId: string, userId: string, content: string): Promise<Comment> {
  const result = await query(
    `INSERT INTO comments (submission_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, submission_id, user_id, content, created_at, updated_at`,
    [submissionId, userId, content]
  );
  return result.rows[0];
}

export async function listCommentsBySubmission(submissionId: string): Promise<Comment[]> {
  const result = await query(
    `SELECT id, submission_id, user_id, content, created_at, updated_at
     FROM comments
     WHERE submission_id = $1
     ORDER BY created_at ASC`,
    [submissionId]
  );
  return result.rows;
}

export async function getCommentById(id: string): Promise<Comment | null> {
  const result = await query(
    `SELECT id, submission_id, user_id, content, created_at, updated_at
     FROM comments WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateComment(id: string, content: string): Promise<Comment | null> {
  const result = await query(
    `UPDATE comments SET content = $1, updated_at = now()
     WHERE id = $2
     RETURNING id, submission_id, user_id, content, created_at, updated_at`,
    [content, id]
  );
  return result.rows[0] || null;
}

export async function deleteComment(id: string): Promise<void> {
  await query(`DELETE FROM comments WHERE id = $1`, [id]);
}

// Helpers for permissions
export async function ensureReviewerAndMember(userId: string, submissionId: string, userRole: 'submitter' | 'reviewer') {
  if (userRole !== 'reviewer') return { ok: false, code: 403 as const, message: 'Submitters cannot comment' };
  const submission = await getSubmissionById(submissionId);
  if (!submission) return { ok: false, code: 404 as const, message: 'Submission not found' };
  const member = await isUserMemberOfProject(userId, submission.project_id);
  if (!member) return { ok: false, code: 403 as const, message: 'Not a member of this project' };
  return { ok: true as const, submission };
}
