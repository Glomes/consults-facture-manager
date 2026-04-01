import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({

  connectionString: 'postgresql://admin:password123@medflow_db:5432/medflow_db'
});