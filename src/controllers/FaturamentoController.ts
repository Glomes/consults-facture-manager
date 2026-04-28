import type { Request, Response } from 'express';
import pool from '../config/database.js';

const conveniosValidos = ['BRADESCO', 'GEAP'];

export const FaturamentoController = {

  async create(req: any, res: Response) {
    const { nome_paciente, documento, exame, convenio, data_atendimento } = req.body;

    try {
      // 🔹 Normalização
      const nome = (nome_paciente || '').trim();
      const convenioFinal = (convenio || '').trim().toUpperCase();

      // 🔹 1. Nome válido
      if (!/[a-zA-Z]/.test(nome)) {
        return res.status(400).json({ error: "Nome inválido" });
      }

      // 🔹 2. Data não pode ser futura
      const data = new Date(data_atendimento);
      const hoje = new Date();

      if (data > hoje) {
        return res.status(400).json({ error: "Data não pode ser futura" });
      }

      // 🔹 3. Validar convênio
      if (!conveniosValidos.includes(convenioFinal)) {
        return res.status(400).json({ error: "Convênio inválido" });
      }

      // 🔹 4. Evitar duplicidade
      const existe = await pool.query(
        `SELECT 1 FROM faturamentos 
         WHERE documento = $1 
         AND exame = $2 
         AND data_atendimento = $3 
         AND usuario_id = $4`,
        [documento, exame, data_atendimento, req.userId]
      );

      if (existe.rows.length > 0) {
        return res.status(400).json({ error: "Registro já existe" });
      }

      // 🔹 5. Insert
      const { rows } = await pool.query(
        `INSERT INTO faturamentos 
         (nome_paciente, documento, exame, convenio, data_atendimento, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [nome, documento, exame, convenioFinal, data_atendimento, req.userId]
      );

      return res.status(201).json(rows[0]);

    } catch (error: any) {
      console.error("ERRO CREATE:", error);
      return res.status(500).json({ error: "Erro ao inserir" });
    }
  },

  async list(req: any, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const { status, convenio, order } = req.query;

      let filtros = ['usuario_id = $1'];
      let valores: any[] = [req.userId];
      let index = 2;

      if (convenio) {
        filtros.push(`convenio = $${index++}`);
        valores.push(String(convenio).toUpperCase());
      }

      if (status === 'nao_enviado') {
        filtros.push(`data_envio IS NULL AND data_faturamento IS NULL`);
      }

      if (status === 'enviado') {
        filtros.push(`data_envio IS NOT NULL AND data_faturamento IS NULL`);
      }

      if (status === 'faturado') {
        filtros.push(`data_faturamento IS NOT NULL`);
      }

      const where = filtros.join(' AND ');

      const orderBy = order === 'asc' ? 'ASC' : 'DESC';

      const query = `
      SELECT * FROM faturamentos
      WHERE ${where}
      ORDER BY created_at ${orderBy}
      LIMIT $${index++} OFFSET $${index}
    `;

      valores.push(limit, offset);

      const { rows } = await pool.query(query, valores);

  
      const countQuery = `
      SELECT COUNT(*) FROM faturamentos
      WHERE ${where}
    `;

      const countResult = await pool.query(countQuery, valores.slice(0, index - 2));
      const total = Number(countResult.rows[0].count);

      return res.json({
        data: rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });

    } catch (error) {
      console.error("ERRO LIST:", error);
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
        `UPDATE faturamentos 
         SET ${campo} = $1 
         WHERE id = $2 AND usuario_id = $3 
         RETURNING *`,
        [valor, id, req.userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Não encontrado" });
      }

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
      await pool.query(
        'DELETE FROM faturamentos WHERE id = $1 AND usuario_id = $2',
        [id, req.userId]
      );

      return res.status(204).send();

    } catch (error) {
      return res.status(500).json({ error: "Erro ao deletar" });
    }
  }
};