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

export type ProjectWithMemberIds = Project & {
  member_ids: string[];
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
  // Conditional insert that works even if there is no unique constraint on (project_id, user_id)
  const result = await query(
    `WITH ins AS (
       INSERT INTO project_members (project_id, user_id)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2
       )
       RETURNING project_id, user_id
     )
     SELECT project_id, user_id FROM ins
     UNION ALL
     SELECT project_id, user_id FROM project_members WHERE project_id = $1 AND user_id = $2
     LIMIT 1`,
    [projectId, userId]
  );
  return result.rows[0];
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await query(`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, [projectId, userId]);
}

export async function listProjectsWithMemberIds(): Promise<ProjectWithMemberIds[]> {
  const result = await query(
    `SELECT 
       p.id,
       p.name,
       p.description,
       p.created_by,
       p.created_at,
       p.updated_at,
       COALESCE(array_agg(pm.user_id) FILTER (WHERE pm.user_id IS NOT NULL), '{}') AS member_ids
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id
     GROUP BY p.id
     ORDER BY p.created_at DESC`
  );
  return result.rows as ProjectWithMemberIds[];
}

export async function getProjectWithMemberIds(id: string): Promise<ProjectWithMemberIds | null> {
  const result = await query(
    `SELECT 
       p.id,
       p.name,
       p.description,
       p.created_by,
       p.created_at,
       p.updated_at,
       COALESCE(array_agg(pm.user_id) FILTER (WHERE pm.user_id IS NOT NULL), '{}') AS member_ids
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  return (result.rows[0] as ProjectWithMemberIds) || null;
}

export type ProjectMemberUser = {
  id: string;
  email: string;
  name: string;
  role: 'submitter' | 'reviewer';
};

export async function listProjectMembers(projectId: string): Promise<ProjectMemberUser[]> {
  const result = await query(
    `SELECT u.id, u.email, u.name, u.role
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY u.name ASC`,
    [projectId]
  );
  return result.rows as ProjectMemberUser[];
}
