import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Error no manejado:', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Error interno del servidor' });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

export function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: result.error.flatten() });
    }
    req.body = result.data;
    next();
  };
}