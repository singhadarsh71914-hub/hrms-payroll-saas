import express from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name && err.name.startsWith('Prisma')) {
    message = 'A database error occurred.';
  }

  if (statusCode === 500 && !(err instanceof AppError)) {
    message = err.message || 'Internal Server Error';
  }
  console.error(`[Error] ${statusCode} - ${message}`);
  if (err.stack) console.error(err.stack);

  res.status(statusCode).json({
    status: 'error',
    message,
  });
};
