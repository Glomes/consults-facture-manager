import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ Erro no cliente Postgres', err);
});

// 🔥 função de retry
export async function connectWithRetry(retries = 10, delay = 3000): Promise<void> {
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('📦 Banco está pronto!');
      return;
    } catch (err) {
      console.log(`⏳ Banco não disponível... tentando novamente (${retries})`);
      retries--;
      await new Promise(res => setTimeout(res, delay));
    }
  }

  throw new Error('❌ Não foi possível conectar ao banco após várias tentativas');
}

export default pool;