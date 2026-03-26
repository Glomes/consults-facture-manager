import { Router } from 'express';
import {
  createAgendamento,
  getAgendamentos,
  getAgendamentoById,
  autorizarAgendamento,
  getAgendamentosAutorizados,
  atenderAgendamento,
  enviarParaFaturamento,
  faturarAgendamento
} from '../controllers/AgendamentoController.js';

import { authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// 🧑‍💼 secretaria
router.post('/', authorize(['secretaria']), createAgendamento);
router.get('/', authorize(['secretaria']), getAgendamentos);
router.get('/:id', authorize(['secretaria']), getAgendamentoById);
router.patch('/:id/autorizar', authorize(['secretaria']), autorizarAgendamento);
router.patch('/:id/enviar-faturamento', authorize(['secretaria']), enviarParaFaturamento);
router.patch('/:id/faturar', authorize(['secretaria']), faturarAgendamento);

// 👨‍⚕️ médico
router.get('/autorizados', authorize(['medico']), getAgendamentosAutorizados);
router.patch('/:id/atender', authorize(['medico']), atenderAgendamento);

export default router;