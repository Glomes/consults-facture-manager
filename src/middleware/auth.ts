import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

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
    const decoded = jwt.verify(token, JWT_SECRET);

    const payload = decoded as unknown as TokenPayload;
    
    (req as any).userId = payload.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};