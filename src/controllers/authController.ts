import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';

const validRoles = ['medico', 'secretaria'];

/**
 * Registro
 */
export const register = async (req: Request, res: Response) => {
  const { nome, email, senha, role, crm } = req.body;

  if (!nome || !email || !senha || !role) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role inválida.' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: 'Senha muito curta.' });
  }

  if (role === 'medico' && !crm) {
    return res.status(400).json({ error: 'CRM é obrigatório para médicos.' });
  }

  try {
    const userExists = await pool.query(
      'SELECT id FROM tb_user WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      `INSERT INTO tb_user (nome, email, senha, role, crm)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, role`,
      [nome, email, hashedPassword, role, crm || null]
    );

    return res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: result.rows[0],
    });

  } catch (err) {
    console.error('Erro no registro:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
  }
};

/**
 * Login
 */
export const login = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM tb_user WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        nome: user.nome,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        role: user.role,
      },
    });

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno ao processar login.' });
  }
};