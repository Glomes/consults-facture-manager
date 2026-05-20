import { Router } from 'express';

import { FaturamentoController } from '../controllers/FaturamentoController.js';
import { AuthController } from '../controllers/AuthController.js';

import { authMiddleware } from '../middleware/auth.js';

const routes = Router();

/* PUBLIC */
routes.post('/register', AuthController.register);
routes.post('/login', AuthController.login);

/* PRIVATE */
routes.use(authMiddleware);

routes.get(
  '/faturamentos',
  FaturamentoController.list
);

routes.post(
  '/faturamentos',
  FaturamentoController.create
);

routes.patch(
  '/faturamentos/:id',
  FaturamentoController.updateStatus
);

routes.delete(
  '/faturamentos/:id',
  FaturamentoController.delete
);

routes.get(
  '/faturamentos/stats',
  FaturamentoController.getStats
);

routes.get(
  '/faturamentos/relatorio',
  FaturamentoController.getRelatorioMensal
);

export default routes;