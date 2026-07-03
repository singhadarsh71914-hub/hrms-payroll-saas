import { NextFunction, Response } from 'express';
// @ts-ignore
import { AppError } from './error';

export const requireVerifiedEmail = (req: any, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  // Allow bypass for SUPERADMIN or system integrations if necessary
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  if (req.user.email_verified !== true) {
    return next(new AppError('Please verify your email address to access this feature.', 403));
  }

  next();
};
