import { TokenPayload } from '../middlewares/authMiddleware';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}