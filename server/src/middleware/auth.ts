import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  //later
  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Placeholder for admin role checking
  next();
};