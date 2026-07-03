import { Request, Response, NextFunction } from 'express';
// @ts-ignore
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './error.ts';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new AppError(
          error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        ));
      }
      return next(error);
    }
  };
};
