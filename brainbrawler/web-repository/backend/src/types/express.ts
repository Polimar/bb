import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

// Utility type per handler async che non ritornano valori
export type AsyncHandler<T = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Wrapper per handler async per evitare problemi di typing
export const asyncHandler = <T = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Tipi specifici per le routes
export type AuthAsyncHandler = AsyncHandler<AuthRequest>; 