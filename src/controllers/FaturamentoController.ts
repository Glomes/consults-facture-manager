import type { Request, Response } from 'express';
import { pool } from '../config/database.js';

export const FaturamentoController = {
  async create(req: Request, res: Response) {
    const { nome_paciente, documento, exame, convenio, data_atendimento } = req.body;
    const query = `
      INSERT INTO faturamentos (nome_paciente, documento, exame, convenio, data_atendimento)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    try {
      const { rows } = await pool.query(query, [nome_paciente, documento, exame, convenio, data_atendimento]);
      return res.status(201).json(rows[0]);
    } catch (error) {
      return res.status(400).json({ error: "Erro ao inserir no banco" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const { rows } = await pool.query('SELECT * FROM faturamentos ORDER BY created_at DESC');
      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar dados" });
    }
  },

  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { data_envio, data_faturamento } = req.body;
    const campo = data_envio ? 'data_envio' : 'data_faturamento';
    const valor = data_envio || data_faturamento;

    try {
      const { rows } = await pool.query(`UPDATE faturamentos SET ${campo} = $1 WHERE id = $2 RETURNING *`, [valor, id]);
      return res.json(rows[0]);
    } catch (error) {
      return res.status(400).json({ error: "Erro ao atualizar status" });
    }
  },

  async getStats(req: Request, res: Response) {
    const query = `
      SELECT 
        convenio as nome,
        COUNT(CASE WHEN data_envio IS NULL AND data_faturamento IS NULL THEN 1 END)::INTEGER as "precisaEnviar",
        COUNT(CASE WHEN data_envio IS NOT NULL AND data_faturamento IS NULL THEN 1 END)::INTEGER as "enviados",
        COUNT(CASE WHEN data_faturamento IS NOT NULL THEN 1 END)::INTEGER as "faturados"
      FROM faturamentos
      GROUP BY convenio;
    `;
    try {
      const { rows } = await pool.query(query);
      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao processar estatísticas" });
    }
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM faturamentos WHERE id = $1', [id]);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao deletar" });
    }
  }
};