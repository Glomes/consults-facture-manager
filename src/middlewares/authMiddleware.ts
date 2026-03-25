import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export interface TokenPayload {
  id: number;
  role: 'medico' | 'secretaria';
  nome: string;
}

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido ou inválido.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      if (
        typeof decoded !== 'object' ||
        !decoded ||
        !('id' in decoded) ||
        !('role' in decoded) ||
        !('nome' in decoded)
      ) {
        return res.status(401).json({ error: 'Token inválido.' });
      }

      const user = decoded as TokenPayload;

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Acesso negado: você não tem permissão para esta área.',
        });
      }

      req.user = user;

      next();
    } catch {
      return res.status(401).json({ error: 'Token expirado ou inválido.' });
    }
  };
};