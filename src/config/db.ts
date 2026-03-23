import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Teste de conexão imediato
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL com sucesso!');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente Postgres', err);
});

export default pool;