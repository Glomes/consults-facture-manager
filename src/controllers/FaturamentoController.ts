import type { Request, Response } from 'express';
import pool from '../config/database.js';

export const FaturamentoController = {
  async create(req: any, res: Response) {
    const { nome_paciente, documento, exame, convenio, data_atendimento } = req.body;
    const query = `
      INSERT INTO faturamentos (nome_paciente, documento, exame, convenio, data_atendimento, usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    try {
      const { rows } = await pool.query(query, [nome_paciente, documento, exame, convenio, data_atendimento, req.userId]);
      return res.status(201).json(rows[0]);
    } catch (error) {
      return res.status(400).json({ error: "Erro ao inserir" });
    }
  },

  async list(req: any, res: Response) {
    try {
  
      const { rows } = await pool.query(
        'SELECT * FROM faturamentos WHERE usuario_id = $1 ORDER BY created_at DESC', 
        [req.userId]
      );
      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar dados" });
    }
  },

  async updateStatus(req: any, res: Response) {
    const { id } = req.params;
    const { data_envio, data_faturamento } = req.body;
    const campo = data_envio ? 'data_envio' : 'data_faturamento';
    const valor = data_envio || data_faturamento;

    try {

      const { rows } = await pool.query(
        `UPDATE faturamentos SET ${campo} = $1 WHERE id = $2 AND usuario_id = $3 RETURNING *`, 
        [valor, id, req.userId]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Não encontrado" });
      return res.json(rows[0]);
    } catch (error) {
      return res.status(400).json({ error: "Erro ao atualizar" });
    }
  },

  async getStats(req: any, res: Response) {
    const query = `
      SELECT 
        convenio as nome,
        COUNT(CASE WHEN data_envio IS NULL AND data_faturamento IS NULL THEN 1 END)::INTEGER as "precisaEnviar",
        COUNT(CASE WHEN data_envio IS NOT NULL AND data_faturamento IS NULL THEN 1 END)::INTEGER as "enviados",
        COUNT(CASE WHEN data_faturamento IS NOT NULL THEN 1 END)::INTEGER as "faturados"
      FROM faturamentos
      WHERE usuario_id = $1
      GROUP BY convenio;
    `;
    try {
      const { rows } = await pool.query(query, [req.userId]);
      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ error: "Erro nas estatísticas" });
    }
  },

  async delete(req: any, res: Response) {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM faturamentos WHERE id = $1 AND usuario_id = $2', [id, req.userId]);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao deletar" });
    }
  }
};

