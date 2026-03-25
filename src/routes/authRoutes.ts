import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/login', login);

// 🔒 Agora protegido corretamente
router.post('/register', authorize(['secretaria']), register);

router.get('/perfil', authorize(['medico', 'secretaria']), (req, res) => {
  res.json({
    message: 'Acesso autorizado!',
    dados: req.user,
  });
});

export default router;