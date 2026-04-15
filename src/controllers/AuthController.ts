import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// A mesma correção aqui para o sign()
const JWT_SECRET = (process.env.JWT_SECRET || 'secret_key_medsync_2024') as string;

export const AuthController = {
  async register(req: Request, res: Response) {
    const { nome, email, senha } = req.body;
    const hash = await bcrypt.hash(senha, 10);
    
    try {
      const { rows } = await pool.query(
        'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
        [nome, email, hash]
      );
      return res.status(201).json(rows[0]);
    } catch (error) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }
  },

  async login(req: Request, res: Response) {
    const { email, senha } = req.body;
    
    try {
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      const user = rows[0];

      if (!user || !(await bcrypt.compare(senha, user.senha))) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Agora o TS aceita o JWT_SECRET sem reclamar de undefined
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      return res.json({ 
        user: { id: user.id, nome: user.nome }, 
        token 
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  }
};