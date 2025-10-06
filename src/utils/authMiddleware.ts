import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SECRET_KEY || 'dev_secret_key';

declare global {
  namespace Express {
    interface UserPayload {
      sub: string;
      role: 'submitter' | 'reviewer';
      iat?: number;
      exp?: number;
    }
    interface Request {
      user?: UserPayload;
    }
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Express.UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorize(roles: Array<'submitter' | 'reviewer'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    // If role not allowed, block
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

// Ensure the authenticated user matches the :id path param or has reviewer role
export function requireSelfOrReviewer() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const idParam = req.params?.id;
    if (!idParam) return res.status(400).json({ message: 'Missing id param' });
    if (req.user.role === 'reviewer' || req.user.sub === idParam) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
}
