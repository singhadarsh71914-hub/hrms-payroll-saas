import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';
import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<Map<string, any>>();

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);
  
  Sentry.setTag('request_id', reqId);
  
  const store = new Map<string, any>();
  store.set('requestId', reqId);
  
  requestContext.run(store, () => {
    next();
  });
};
