CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


DROP TABLE IF EXISTS faturamentos;
CREATE TABLE faturamentos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_paciente VARCHAR(255) NOT NULL,
    documento VARCHAR(50) NOT NULL,
    exame VARCHAR(100) NOT NULL,
    convenio VARCHAR(100) NOT NULL,
    data_atendimento TIMESTAMP NOT NULL,
    data_envio TIMESTAMP,
    data_faturamento TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faturamentos_usuario ON faturamentos(usuario_id);