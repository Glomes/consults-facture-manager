import { Router } from 'express';
import { FaturamentoController } from '../controllers/FaturamentoController.js';

const routes = Router();

routes.get('/faturamentos', FaturamentoController.list); // Verifica se 'list' existe no controller
routes.post('/faturamentos', FaturamentoController.create);
routes.patch('/faturamentos/:id', FaturamentoController.updateStatus);
routes.get('/faturamentos/stats', FaturamentoController.getStats);
routes.delete('/faturamentos/:id', FaturamentoController.delete); // Verifica se 'delete' existe no controller

export default routes;