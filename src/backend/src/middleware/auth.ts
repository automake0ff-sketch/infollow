import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthUser } from '../services/authService';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado - token requerido' });
  }
  const token = authHeader.slice(7);
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  req.user = user;
  next();
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (user) req.user = user;
  }
  next();
}

export function requireRole(...roles: ('owner' | 'agent')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sin permisos suficientes' });
    }
    next();
  };
}

export function agencyScopeMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  next();
}