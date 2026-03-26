import type { Request, Response } from 'express';
import pool from '../config/db.js';

/**
 * 🧑‍💼 Criar agendamento
 */
export const createAgendamento = async (req: Request, res: Response) => {
  const {
    nome_paciente,
    documento,
    tipo_exame,
    convenio,
    data_atendimento
  } = req.body;

  if (!nome_paciente || !documento || !tipo_exame || !data_atendimento) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tb_agendamento 
      (nome_paciente, documento, tipo_exame, convenio, data_atendimento)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [nome_paciente, documento, tipo_exame, convenio, data_atendimento]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar agendamento.' });
  }
};

/**
 * 🔎 Listar agendamentos (com filtro opcional)
 */
export const getAgendamentos = async (req: Request, res: Response) => {
  const { status } = req.query;

  try {
    let query = `SELECT * FROM tb_agendamento`;
    const values: any[] = [];

    if (status) {
      query += ` WHERE status = $1`;
      values.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);

    return res.json(result.rows);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
  }
};

/**
 * 🔎 Buscar por ID
 */
export const getAgendamentoById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM tb_agendamento WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }

    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar agendamento.' });
  }
};

/**
 * 🧑‍💼 Autorizar convênio
 */
export const autorizarAgendamento = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE tb_agendamento
       SET autorizado = true,
           data_autorizacao = NOW(),
           status = 'autorizado'
       WHERE id = $1 AND status = 'pendente'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Agendamento não encontrado ou já autorizado.' });
    }

    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Erro ao autorizar.' });
  }
};

/**
 * 👨‍⚕️ Listar autorizados (médico)
 */
export const getAgendamentosAutorizados = async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM tb_agendamento WHERE status = 'autorizado'`
  );

  return res.json(result.rows);
};

/**
 * 👨‍⚕️ Realizar atendimento
 */
export const atenderAgendamento = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { houve_atendimento, paciente_compareceu } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tb_agendamento
       SET 
         houve_atendimento = $1,
         paciente_compareceu = $2,
         data_real_atendimento = NOW(),
         status = 'finalizado'
       WHERE id = $3 AND status = 'autorizado'
       RETURNING *`,
      [houve_atendimento, paciente_compareceu, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Agendamento não autorizado ou inexistente.' });
    }

    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Erro no atendimento.' });
  }
};

/**
 * 🧾 Enviar para faturamento
 */
export const enviarParaFaturamento = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE tb_agendamento
       SET 
         data_envio_faturamento = NOW(),
         status = 'faturamento'
       WHERE id = $1 AND status = 'finalizado'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Agendamento não finalizado ou inexistente.' });
    }

    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Erro ao enviar para faturamento.' });
  }
};

/**
 * 🧾 Faturar (final)
 */
export const faturarAgendamento = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE tb_agendamento
       SET 
         faturado = true,
         data_faturamento = NOW(),
         status = 'concluido'
       WHERE id = $1 AND status = 'faturamento'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Agendamento não enviado para faturamento ou inexistente.' });
    }

    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Erro no faturamento.' });
  }
};