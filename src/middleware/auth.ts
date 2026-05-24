import express from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends express.Request {
  user?: {
    id: string;
    role: string;
    company_id: string | null;
    email?: string;
    employee_id?: string;
  };
}

export const authenticate = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new AppError('No token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Unauthorized access', 403));
    }
    next();
  };
};
