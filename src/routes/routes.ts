import { Router } from 'express';
import { FaturamentoController } from '../controllers/FaturamentoController.js';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const routes = Router();

// Rotas Públicas
routes.post('/register', AuthController.register);
routes.post('/login', AuthController.login);

// Todas as rotas abaixo exigem o Token JWT
routes.use(authMiddleware);

routes.get('/faturamentos', FaturamentoController.list);
routes.post('/faturamentos', FaturamentoController.create);
routes.patch('/faturamentos/:id', FaturamentoController.updateStatus);
routes.get('/faturamentos/stats', FaturamentoController.getStats);
routes.delete('/faturamentos/:id', FaturamentoController.delete);

export default routes;