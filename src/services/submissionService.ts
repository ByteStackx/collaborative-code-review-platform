import { query } from '../config/db';

export type SubmissionStatus = 'pending' | 'in_review' | 'approved' | 'changes_requested';

export type Submission = {
  id: string;
  project_id: string;
  submitted_by: string | null;
  title: string;
  content: string;
  status: SubmissionStatus;
  created_at: Date;
  updated_at: Date;
};

export async function ensureSubmissionsTable() {
  // Use TEXT ids to align with existing users/projects id types
  await query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      submitted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT CHECK (status IN ('pending','in_review','approved','changes_requested')) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS submissions_project_idx ON submissions(project_id);`);
  await query(`CREATE INDEX IF NOT EXISTS submissions_submitted_by_idx ON submissions(submitted_by);`);
}

export async function createSubmission(projectId: string, submittedBy: string, title: string, content: string): Promise<Submission> {
  const result = await query(
    `INSERT INTO submissions (project_id, submitted_by, title, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, project_id, submitted_by, title, content, status, created_at, updated_at`,
    [projectId, submittedBy, title, content]
  );
  return result.rows[0];
}

export async function listSubmissionsByProject(projectId: string): Promise<Submission[]> {
  const result = await query(
    `SELECT id, project_id, submitted_by, title, content, status, created_at, updated_at
     FROM submissions WHERE project_id = $1
     ORDER BY created_at DESC`,
    [projectId]
  );
  return result.rows;
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  const result = await query(
    `SELECT id, project_id, submitted_by, title, content, status, created_at, updated_at
     FROM submissions WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<Submission | null> {
  const allowed: SubmissionStatus[] = ['pending', 'in_review', 'approved', 'changes_requested'];
  if (!allowed.includes(status)) throw new Error('Invalid status');
  const result = await query(
    `UPDATE submissions SET status = $1, updated_at = now()
     WHERE id = $2
     RETURNING id, project_id, submitted_by, title, content, status, created_at, updated_at`,
    [status, id]
  );
  return result.rows[0] || null;
}

export async function deleteSubmission(id: string): Promise<void> {
  await query(`DELETE FROM submissions WHERE id = $1`, [id]);
}

export async function projectExists(projectId: string): Promise<boolean> {
  const res = await query(`SELECT 1 FROM projects WHERE id = $1`, [projectId]);
  return !!res.rowCount;
}

export async function isUserMemberOfProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const res = await query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 LIMIT 1`,
      [projectId, userId]
    );
    if (res.rowCount && res.rowCount > 0) return true;
  } catch (err: any) {
    if (err?.code !== '42P01') throw err; // if table missing, fall through
  }
  // Fallback: allow creator of the project
  const creator = await query(`SELECT 1 FROM projects WHERE id = $1 AND created_by = $2`, [projectId, userId]);
  return !!creator.rowCount;
}
