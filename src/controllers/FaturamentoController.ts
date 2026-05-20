import type { Request, Response } from 'express';
import pool from '../config/database.js';

const CONVENIOS_VALIDOS = ['BRADESCO', 'GEAP'];

export const FaturamentoController = {

  async create(req: any, res: Response) {
    try {

      const {
        nome_paciente,
        documento,
        exame,
        convenio,
        data_atendimento
      } = req.body;

      const nome = String(nome_paciente || '').trim();
      const convenioFormatado = String(convenio || '')
        .trim()
        .toUpperCase();

      if (!nome || !/[a-zA-ZÀ-ÿ]/.test(nome)) {
        return res.status(400).json({
          error: 'Nome inválido'
        });
      }

      if (!CONVENIOS_VALIDOS.includes(convenioFormatado)) {
        return res.status(400).json({
          error: 'Convênio inválido'
        });
      }

      const data = new Date(data_atendimento);

      if (isNaN(data.getTime())) {
        return res.status(400).json({
          error: 'Data inválida'
        });
      }

      if (data > new Date()) {
        return res.status(400).json({
          error: 'Data futura não permitida'
        });
      }

      const existe = await pool.query(
        `
        SELECT id
        FROM faturamentos
        WHERE documento = $1
        AND exame = $2
        AND data_atendimento = $3
        AND usuario_id = $4
        `,
        [
          documento,
          exame,
          data_atendimento,
          req.userId
        ]
      );

      if (existe.rows.length > 0) {
        return res.status(400).json({
          error: 'Registro já existe'
        });
      }

      const { rows } = await pool.query(
        `
        INSERT INTO faturamentos (
          nome_paciente,
          documento,
          exame,
          convenio,
          data_atendimento,
          usuario_id
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
        `,
        [
          nome,
          documento,
          exame,
          convenioFormatado,
          data_atendimento,
          req.userId
        ]
      );

      return res.status(201).json(rows[0]);

    } catch (error) {

      console.error('CREATE ERROR:', error);

      return res.status(500).json({
        error: 'Erro ao criar faturamento'
      });
    }
  },

  async list(req: any, res: Response) {
    try {

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const offset = (page - 1) * limit;

      const {
        convenio,
        status,
        order
      } = req.query;

      const filtros: string[] = [
        'usuario_id = $1'
      ];

      const valores: any[] = [req.userId];

      let index = 2;

      if (convenio) {
        filtros.push(`convenio = $${index}`);
        valores.push(String(convenio).toUpperCase());
        index++;
      }

      if (status === 'nao_enviado') {
        filtros.push(`
          data_envio IS NULL
        `);
      }

      if (status === 'enviado') {
        filtros.push(`
          data_envio IS NOT NULL
          AND data_faturamento IS NULL
        `);
      }

      if (status === 'faturado') {
        filtros.push(`
          data_faturamento IS NOT NULL
          AND data_recebimento IS NULL
        `);
      }

      if (status === 'recebido') {
        filtros.push(`
          data_recebimento IS NOT NULL
        `);
      }

      const where = filtros.join(' AND ');

      const orderBy =
        order === 'asc'
          ? 'ASC'
          : 'DESC';

      const query = `
        SELECT *
        FROM faturamentos
        WHERE ${where}
        ORDER BY created_at ${orderBy}
        LIMIT $${index}
        OFFSET $${index + 1}
      `;

      valores.push(limit);
      valores.push(offset);

      const result = await pool.query(query, valores);

      const totalResult = await pool.query(
        `
        SELECT COUNT(*)
        FROM faturamentos
        WHERE ${where}
        `,
        valores.slice(0, index - 1)
      );

      const total = Number(totalResult.rows[0].count);

      return res.json({
        data: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });

    } catch (error) {

      console.error('LIST ERROR:', error);

      return res.status(500).json({
        error: 'Erro ao listar faturamentos'
      });
    }
  },

  async updateStatus(req: any, res: Response) {

    try {

      const { id } = req.params;
      const { tipo } = req.body;

      if (!tipo) {
        return res.status(400).json({
          error: 'Tipo não informado'
        });
      }

      const busca = await pool.query(
        `
        SELECT
          id,
          data_envio,
          data_faturamento,
          data_recebimento
        FROM faturamentos
        WHERE id = $1
        AND usuario_id = $2
        `,
        [id, req.userId]
      );

      if (busca.rows.length === 0) {
        return res.status(404).json({
          error: 'Faturamento não encontrado'
        });
      }

      const item = busca.rows[0];

      let campo = '';

      switch (tipo) {

        case 'envio':

          if (item.data_envio) {
            return res.status(400).json({
              error: 'Já enviado'
            });
          }

          campo = 'data_envio';

        break;

        case 'faturamento':

          if (!item.data_envio) {
            return res.status(400).json({
              error: 'Precisa ser enviado primeiro'
            });
          }

          if (item.data_faturamento) {
            return res.status(400).json({
              error: 'Já faturado'
            });
          }

          campo = 'data_faturamento';

        break;

        case 'recebimento':

          if (!item.data_faturamento) {
            return res.status(400).json({
              error: 'Precisa ser faturado primeiro'
            });
          }

          if (item.data_recebimento) {
            return res.status(400).json({
              error: 'Já recebido'
            });
          }

          campo = 'data_recebimento';

        break;

        default:

          return res.status(400).json({
            error: 'Tipo inválido'
          });
      }

      const update = await pool.query(
        `
        UPDATE faturamentos
        SET ${campo} = NOW()
        WHERE id = $1
        AND usuario_id = $2
        RETURNING *
        `,
        [id, req.userId]
      );

      return res.json(update.rows[0]);

    } catch (error) {

      console.error('UPDATE STATUS ERROR:', error);

      return res.status(500).json({
        error: 'Erro ao atualizar status'
      });
    }
  },

  async delete(req: any, res: Response) {

    try {

      const { id } = req.params;

      await pool.query(
        `
        DELETE FROM faturamentos
        WHERE id = $1
        AND usuario_id = $2
        `,
        [id, req.userId]
      );

      return res.status(204).send();

    } catch (error) {

      console.error('DELETE ERROR:', error);

      return res.status(500).json({
        error: 'Erro ao deletar'
      });
    }
  },

  async getStats(req: any, res: Response) {

    try {

      const { rows } = await pool.query(
        `
        SELECT
          convenio as nome,

          COUNT(*) FILTER (
            WHERE data_envio IS NULL
          )::INTEGER as "precisaEnviar",

          COUNT(*) FILTER (
            WHERE data_envio IS NOT NULL
            AND data_faturamento IS NULL
          )::INTEGER as "enviados",

          COUNT(*) FILTER (
            WHERE data_faturamento IS NOT NULL
            AND data_recebimento IS NULL
          )::INTEGER as "faturados",

          COUNT(*) FILTER (
            WHERE data_recebimento IS NOT NULL
          )::INTEGER as "recebidos"

        FROM faturamentos
        WHERE usuario_id = $1
        GROUP BY convenio
        `,
        [req.userId]
      );

      return res.json(rows);

    } catch (error) {

      console.error('STATS ERROR:', error);

      return res.status(500).json({
        error: 'Erro ao buscar estatísticas'
      });
    }
  }
};