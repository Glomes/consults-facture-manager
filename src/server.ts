import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { connectWithRetry } from './config/db.js';
import { initDatabase } from './config/initiDB.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectWithRetry();

    // 🔥 AQUI A MÁGICA
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 MedFlow rodando na porta ${PORT}`);
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

startServer();