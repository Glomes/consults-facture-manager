-- Criar tabela de faturamentos
CREATE TABLE IF NOT EXISTS faturamentos (
    id SERIAL PRIMARY KEY,
    nome_paciente VARCHAR(255) NOT NULL,
    documento VARCHAR(50) NOT NULL,
    exame VARCHAR(100) NOT NULL,
    convenio VARCHAR(100) NOT NULL,
    data_atendimento TIMESTAMP NOT NULL,
    data_envio TIMESTAMP,
    data_faturamento TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index para otimizar a busca por convênio no dashboard
CREATE INDEX IF NOT EXISTS idx_faturamentos_convenio ON faturamentos(convenio);