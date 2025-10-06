import bcrypt from 'bcrypt';
import { query } from '../config/db';

export type User = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'submitter' | 'reviewer';
  created_at: Date;
  updated_at: Date;
};

export type PublicUser = Omit<User, 'password_hash'>;

const SALT_ROUNDS = 10;

export async function ensureUsersTable() {
  // Create users table if it doesn't exist. Uses TEXT id with a default hash to avoid requiring extensions.
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'submitter',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`);
}

export async function createUser(email: string, name: string, password: string, role: 'submitter' | 'reviewer' = 'submitter'): Promise<PublicUser> {
  try {
    let existing: User | null;
    try {
      existing = await getUserByEmail(email);
    } catch (err: any) {
      // Relation does not exist -> ensure table then retry once
      if (err?.code === '42P01') {
        console.warn('users table missing; creating now...');
        await ensureUsersTable();
        existing = await getUserByEmail(email);
      } else {
        throw err;
      }
    }
    if (existing) throw new Error('Email already in use');
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const roleNormalized = (role || 'submitter').toLowerCase() as 'submitter' | 'reviewer';
    try {
      const result = await query(
        `INSERT INTO users (email, name, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, role, created_at, updated_at`,
        [email, name, password_hash, roleNormalized]
      );
      return result.rows[0];
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new Error('Email already in use');
      }
      if (err?.code === '23514') {
        console.error('Role check constraint violated; normalizing constraint then retrying insert...');
        const result = await query(
          `INSERT INTO users (email, name, password_hash, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, name, role, created_at, updated_at`,
          [email, name, password_hash, roleNormalized]
        );
        return result.rows[0];
      }
      console.error('createUser insert error:', err);
      throw err;
    }
  } catch (err) {
    console.error('createUser failed:', err);
    throw err;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const result = await query(`SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

export async function updateUser(id: string, fields: Partial<{email: string; name: string; password: string; role: 'user' | 'admin'}>): Promise<PublicUser | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (fields.email) { updates.push(`email = $${idx++}`); values.push(fields.email); }
  if (fields.name) { updates.push(`name = $${idx++}`); values.push(fields.name); }
  if (fields.role) { updates.push(`role = $${idx++}`); values.push(fields.role.toLowerCase() as 'submitter' | 'reviewer'); }
  if (fields.password) {
    const hash = await bcrypt.hash(fields.password, SALT_ROUNDS);
    updates.push(`password_hash = $${idx++}`);
    values.push(hash);
  }
  updates.push(`updated_at = now()`);

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, name, role, created_at, updated_at`;
  values.push(id);
  const result = await query(sql, values);
  return result.rows[0] || null;
}

export async function deleteUser(id: string): Promise<void> {
  await query(`DELETE FROM users WHERE id = $1`, [id]);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
