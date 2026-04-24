import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/routes.js';
import helmet from 'helmet';


const app = express();

app.use(express.json());

app.use(helmet({
  contentSecurityPolicy: false
}));

const allowedOrigins = [
  'http://localhost:3000',
  'https://seu-frontend.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));

app.use(routes);

const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});

