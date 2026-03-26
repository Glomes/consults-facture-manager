import pool from './db.js';
import bcrypt from 'bcrypt';

export async function initDatabase() {
  try {
    console.log('📦 Inicializando banco...');

    // 🔹 Tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_user (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('medico', 'secretaria')) NOT NULL,
        crm VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 🔹 Tabela de convênio
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_convenio (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) UNIQUE NOT NULL,
        prazo_pagamento_days INTEGER DEFAULT 30,
        prazo_retorno_days INTEGER DEFAULT 15
      );
    `);
    
    await pool.query(`
  CREATE TABLE IF NOT EXISTS tb_agendamento (
    id SERIAL PRIMARY KEY,

    nome_paciente VARCHAR(255) NOT NULL,
    documento VARCHAR(50) NOT NULL,

    tipo_exame VARCHAR(255) NOT NULL,
    convenio VARCHAR(100),

    data_agendamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atendimento TIMESTAMP,

    autorizado BOOLEAN DEFAULT FALSE,
    data_autorizacao TIMESTAMP,

    houve_atendimento BOOLEAN,
    paciente_compareceu BOOLEAN,
    data_real_atendimento TIMESTAMP,

    faturado BOOLEAN DEFAULT FALSE,
    data_faturamento TIMESTAMP,
    data_envio_faturamento TIMESTAMP,

    status VARCHAR(50) DEFAULT 'pendente',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);
    

    // 🔹 Convênio padrão
    await pool.query(`
      INSERT INTO tb_convenio (nome, prazo_pagamento_days, prazo_retorno_days)
      VALUES ('Unimed', 30, 15)
      ON CONFLICT (nome) DO NOTHING;
    `);

    // 🔥 USUÁRIO DE TESTE
    const email = 'admin@email.com';

    const userExists = await pool.query(
      'SELECT id FROM tb_user WHERE email = $1',
      [email]
    );

    if (userExists.rows.length === 0) {
      const senhaHash = await bcrypt.hash('123456', 10);

      await pool.query(
        `INSERT INTO tb_user (nome, email, senha, role)
         VALUES ($1, $2, $3, $4)`,
        ['Admin', email, senhaHash, 'secretaria']
      );

      console.log('👤 Usuário de teste criado!');
    } else {
      console.log('👤 Usuário de teste já existe.');
    }

    console.log('✅ Banco inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err);
    throw err;
  }
}