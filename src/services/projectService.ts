import { query } from '../config/db';

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ProjectMember = {
  project_id: string;
  user_id: string;
};

export async function ensureProjectTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

}

export async function createProject(name: string, description: string | undefined, createdBy: string): Promise<Project> {
  const result = await query(
    `INSERT INTO projects (name, description, created_by)
     VALUES ($1, $2, $3)
     RETURNING id, name, description, created_by, created_at, updated_at`,
    [name, description ?? null, createdBy]
  );
  return result.rows[0];
}

export async function listProjects(): Promise<Project[]> {
  const result = await query(`SELECT id, name, description, created_by, created_at, updated_at FROM projects ORDER BY created_at DESC`);
  return result.rows;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const result = await query(`SELECT id, name, description, created_by, created_at, updated_at FROM projects WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function addMember(projectId: string, userId: string): Promise<ProjectMember> {
  const result = await query(
    `INSERT INTO project_members (project_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (project_id, user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING project_id, user_id`,
    [projectId, userId]
  );
  return result.rows[0];
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await query(`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, [projectId, userId]);
}
