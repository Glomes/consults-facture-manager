import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = (process.env.JWT_SECRET || 'secret_key_medsync_2024') as string;

interface TokenPayload {
  id: number;
  iat: number;
  exp: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro no formato do token' });
  }

  const token = parts[1] as string;

  try {
    // 1. Fazemos a verificação pura primeiro
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Fazemos o cast de forma segura para o objeto que queremos
    const payload = decoded as unknown as TokenPayload;
    
    // 3. Injetamos no request
    (req as any).userId = payload.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};