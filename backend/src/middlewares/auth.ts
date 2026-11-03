import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AppError } from './errorHandler';
import { AuthenticatedUser } from '../types/express';

interface JwtPayloadWithUser {
  userId: string;
  email: string;
  organizationId: string;
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing token.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayloadWithUser;
    
    if (!decoded.userId || !decoded.organizationId) {
      return next(new AppError('Invalid token payload.', 401));
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
    };
    req.organizationId = decoded.organizationId;

    return next();
  } catch (error: any) {
    return next(new AppError('Session expired or invalid token. Please log in again.', 401));
  }
};
