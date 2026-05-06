import type { Response } from 'express';
import pool from '../config/database.js';

const conveniosValidos = ['BRADESCO', 'GEAP'];

export const FaturamentoController = {

  async create(req: any, res: Response) {
    const { nome_paciente, documento, exame, convenio, data_atendimento } = req.body;

    try {
      const nome = (nome_paciente || '').trim();
      const convenioFinal = (convenio || '').trim().toUpperCase();

      if (!/[a-zA-Z]/.test(nome)) {
        return res.status(400).json({ error: "Nome inválido" });
      }

      const data = new Date(data_atendimento);
      if (data > new Date()) {
        return res.status(400).json({ error: "Data não pode ser futura" });
      }

      if (!conveniosValidos.includes(convenioFinal)) {
        return res.status(400).json({ error: "Convênio inválido" });
      }

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

      const { rows } = await pool.query(
        `INSERT INTO faturamentos 
         (nome_paciente, documento, exame, convenio, data_atendimento, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [nome, documento, exame, convenioFinal, data_atendimento, req.userId]
      );

      return res.status(201).json(rows[0]);

    } catch (error) {
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
      } else if (status === 'enviado') {
        filtros.push(`data_envio IS NOT NULL AND data_faturamento IS NULL`);
      } else if (status === 'faturado') {
        filtros.push(`data_faturamento IS NOT NULL AND data_recebimento IS NULL`);
      } else if (status === 'recebido') {
        filtros.push(`data_recebimento IS NOT NULL`);
      }

      const where = filtros.join(' AND ');
      const orderBy = order === 'asc' ? 'ASC' : 'DESC';

      const query = `
        SELECT * FROM faturamentos
        WHERE ${where}
        ORDER BY COALESCE(data_recebimento, data_faturamento, data_envio, created_at) ${orderBy}
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
    const { tipo } = req.body;

    try {
      if (!tipo) {
        return res.status(400).json({ error: "Tipo não informado" });
      }

      const { rows } = await pool.query(
        `SELECT data_envio, data_faturamento, data_recebimento 
         FROM faturamentos 
         WHERE id = $1 AND usuario_id = $2`,
        [id, req.userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Não encontrado" });
      }

      const item = rows[0];
      let campo = '';

      if (tipo === 'envio') {
        if (item.data_envio) return res.status(400).json({ error: "Já enviado" });
        campo = 'data_envio';
      } else if (tipo === 'faturamento') {
        if (!item.data_envio) return res.status(400).json({ error: "Precisa ser enviado antes" });
        if (item.data_faturamento) return res.status(400).json({ error: "Já faturado" });
        campo = 'data_faturamento';
      } else if (tipo === 'recebimento') {
        if (!item.data_faturamento) return res.status(400).json({ error: "Precisa ser faturado antes" });
        if (item.data_recebimento) return res.status(400).json({ error: "Já recebido" });
        campo = 'data_recebimento';
      } else {
        return res.status(400).json({ error: "Tipo inválido" });
      }

      const update = await pool.query(
        `UPDATE faturamentos 
         SET ${campo} = NOW()
         WHERE id = $1 AND usuario_id = $2
         RETURNING *`,
        [id, req.userId]
      );

      return res.json(update.rows[0]);

    } catch (error) {
      console.error("ERRO UPDATE STATUS:", error);
      return res.status(500).json({ error: "Erro ao atualizar status" });
    }
  },

  async relatorioMensal(req: any, res: Response) {
    const { mes, ano } = req.query;

    try {
      const { rows } = await pool.query(
        `
        SELECT
          COUNT(*) FILTER (
            WHERE data_envio IS NOT NULL
            AND EXTRACT(MONTH FROM data_envio) = $2
            AND EXTRACT(YEAR FROM data_envio) = $3
          ) AS enviados,

          COUNT(*) FILTER (
            WHERE data_faturamento IS NOT NULL
            AND EXTRACT(MONTH FROM data_faturamento) = $2
            AND EXTRACT(YEAR FROM data_faturamento) = $3
          ) AS faturados,

          COUNT(*) FILTER (
            WHERE data_recebimento IS NOT NULL
            AND EXTRACT(MONTH FROM data_recebimento) = $2
            AND EXTRACT(YEAR FROM data_recebimento) = $3
          ) AS recebidos

        FROM faturamentos
        WHERE usuario_id = $1
        `,
        [req.userId, mes, ano]
      );

      return res.json(rows[0]);

    } catch (error) {
      console.error("ERRO RELATÓRIO:", error);
      return res.status(500).json({ error: "Erro no relatório" });
    }
  },

  async getStats(req: any, res: Response) {
    try {
      const { rows } = await pool.query(
        `
        SELECT 
          convenio as nome,

          COUNT(CASE 
            WHEN data_envio IS NULL AND data_faturamento IS NULL 
            THEN 1 END)::INTEGER as "precisaEnviar",

          COUNT(CASE 
            WHEN data_envio IS NOT NULL AND data_faturamento IS NULL 
            THEN 1 END)::INTEGER as "enviados",

          COUNT(CASE 
            WHEN data_faturamento IS NOT NULL AND data_recebimento IS NULL 
            THEN 1 END)::INTEGER as "faturados",

          COUNT(CASE 
            WHEN data_recebimento IS NOT NULL 
            THEN 1 END)::INTEGER as "recebidos"

        FROM faturamentos
        WHERE usuario_id = $1
        GROUP BY convenio
        `,
        [req.userId]
      );

      return res.json(rows);

    } catch (error) {
      console.error("ERRO STATS:", error);
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