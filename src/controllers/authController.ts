import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { createUser, getUserByEmail, verifyPassword } from '../services/userService';

const JWT_SECRET = process.env.SECRET_KEY || 'dev_secret_key';
const JWT_EXPIRES_IN = '1h';

export async function register(req: Request, res: Response) {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'email, name and password are required' });
    }
  const user = await createUser(email, name, password, 'submitter');
    return res.status(201).json(user);
  } catch (err: any) {
    if (err?.message?.includes('Email already in use')) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    console.error('Register error:', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: err?.message ?? String(err),
      code: (err as any)?.code
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login error' });
  }
}
