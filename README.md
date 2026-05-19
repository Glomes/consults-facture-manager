# 💰 Consults Facture Manager

API RESTful para gerenciamento e monitoramento de faturamento de consultas médicas em clínicas conveniadas.

## 📋 Visão Geral

O **Consults Facture Manager** é uma solução completa para rastrear o ciclo de vida do faturamento de atendimentos médicos, desde a consulta até o recebimento do pagamento. A aplicação permite que usuários (clínicas) monitorem o status do faturamento com múltiplos convênios e gera relatórios detalhados.

## ✨ Features

- 🔐 **Autenticação JWT** - Segurança em todas as rotas protegidas
- 📊 **CRUD de Faturamentos** - Criação, leitura, atualização e deleção de registros
- 🔄 **Rastreamento de Status** - Acompanhamento completo: não enviado → enviado → faturado → recebido
- 📈 **Relatórios Mensais** - Dados consolidados por mês e ano
- 📉 **Estatísticas por Convênio** - Dashboard com métricas aggregadas
- 🔍 **Filtros Avançados** - Busca por status, convênio e ordenação
- 📄 **Validação de Dados** - Middleware customizado para garantir integridade
- 🐳 **Docker Ready** - Containerização completa com Docker Compose
- ⚡ **Paginação** - Suporte a listagens paginadas

## 🛠️ Tecnologias Utilizadas

### Backend

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem de programação tipada
- **Express.js** - Framework web minimalista e robusto
- **PostgreSQL** - Banco de dados relacional
- **pg** - Cliente PostgreSQL para Node.js
- **JWT (jsonwebtoken)** - Autenticação segura
- **bcryptjs** - Hash seguro de senhas
- **Helmet** - Middleware de segurança HTTP
- **CORS** - Compartilhamento de recursos entre origens

### Desenvolvimento

- **TypeScript** - Type safety
- **Prettier** - Formatação automática de código
- **ESLint** - Linting e análise de código
- **Docker & Docker Compose** - Containerização

## 🏗️ Arquitetura do Projeto

```
src/
├── controllers/
│   ├── AuthController.ts        # Autenticação (register, login)
│   └── FaturamentoController.ts # CRUD de faturamentos
├── middleware/
│   └── auth.ts                  # Validação de JWT
├── routes/
│   └── routes.ts                # Definição de rotas
├── config/
│   ├── database.ts              # Pool de conexões PostgreSQL
│   └── init.sql                 # Schema inicial do banco
└── server.ts                    # Ponto de entrada da aplicação
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `usuarios`
Armazena informações dos usuários/clínicas do sistema.

```sql
- id (SERIAL PRIMARY KEY)
- nome (VARCHAR 255)
- email (VARCHAR 255 UNIQUE)
- senha (VARCHAR 255 - bcrypt hash)
- created_at (TIMESTAMP)
```

#### `faturamentos`
Registro central de todos os atendimentos e seu ciclo de faturamento.

```sql
- id (SERIAL PRIMARY KEY)
- usuario_id (FOREIGN KEY → usuarios.id)
- nome_paciente (VARCHAR 255)
- documento (VARCHAR 50)
- exame (VARCHAR 100)
- convenio (VARCHAR 100)
- data_atendimento (TIMESTAMP)
- data_envio (TIMESTAMP - nullable)
- data_faturamento (TIMESTAMP - nullable)
- data_recebimento (TIMESTAMP - nullable)
- created_at (TIMESTAMP)
```

### Índices
- `idx_faturamentos_usuario` - Performance em buscas por usuário

## 🚀 Como Executar

### Pré-requisitos

- Node.js 16+
- npm ou yarn
- PostgreSQL (ou use Docker)
- Git

### Instalação Local

1. **Clone o repositório**

```bash
git clone https://github.com/Glomes/consults-facture-manager.git
cd consults-facture-manager
```

2. **Instale as dependências**

```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados
DATABASE_URL=postgres://user:password@localhost:5432/faturamento_db

# PostgreSQL (se usar Docker)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=seu_password_aqui
POSTGRES_DB=faturamento_db

# JWT
JWT_SECRET=sua_chave_secreta_super_segura

# Express
PORT=3001
NODE_ENV=development
```

4. **Execute as migrations do banco**

```bash
npm run db:migrate
```

5. **Inicie a aplicação**

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm run build
npm start
```

A API estará disponível em: `http://localhost:3001`

### Execução com Docker

1. **Execute com Docker Compose**

```bash
# Build e execução (primeira vez)
docker compose up --build

# Execuções subsequentes
docker compose up -d

# Parar os containers
docker compose down

# Remover volumes (limpar banco de dados)
docker compose down -v
```

A aplicação estará em: `http://localhost:3001`

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia em modo watch
npm run build            # Compila TypeScript

# Produção
npm start               # Executa aplicação compilada

# Banco de dados
npm run db:migrate      # Executa migrations (requer DATABASE_URL no .env)

# Qualidade de Código
npm run lint            # Executa ESLint
npm run lint:fix        # Corrige problemas automaticamente
npm run format          # Formata com Prettier

# Testes
npm test               # Executa suite de testes
npm run test:watch     # Modo watch
npm run test:coverage  # Cobertura de testes
```

## 🔌 Endpoints da API

### 🔓 Autenticação (Público)

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| POST | `/register` | Registrar novo usuário | `{ nome, email, senha }` |
| POST | `/login` | Login e obter JWT | `{ email, senha }` |

### 🔐 Faturamentos (Requer JWT)

Todos os endpoints abaixo exigem o header:
```
Authorization: Bearer SEU_TOKEN_JWT
```

| Método | Endpoint | Descrição | Query/Payload |
|--------|----------|-----------|---------------|
| GET | `/faturamentos` | Listar faturamentos | `?page=1&limit=20&status=&convenio=&order=desc` |
| POST | `/faturamentos` | Criar novo faturamento | `{ nome_paciente, documento, exame, convenio, data_atendimento }` |
| PATCH | `/faturamentos/:id` | Atualizar status | `{ tipo: "envio\|faturamento\|recebimento" }` |
| DELETE | `/faturamentos/:id` | Remover faturamento | - |
| GET | `/faturamentos/stats` | Estatísticas por convênio | - |

## 📌 Exemplos de Uso

### 1. Registrar Usuário

```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Clínica ABC",
    "email": "clinica@example.com",
    "senha": "senha_segura_123"
  }'
```

**Resposta (201):**
```json
{
  "id": 1,
  "nome": "Clínica ABC",
  "email": "clinica@example.com"
}
```

### 2. Fazer Login

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "clinica@example.com",
    "senha": "senha_segura_123"
  }'
```

**Resposta (200):**
```json
{
  "user": {
    "id": 1,
    "nome": "Clínica ABC"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Criar Faturamento

```bash
curl -X POST http://localhost:3001/faturamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome_paciente": "João Silva",
    "documento": "123.456.789-00",
    "exame": "Consulta Cardiologia",
    "convenio": "BRADESCO",
    "data_atendimento": "2026-05-15T10:30:00"
  }'
```

**Resposta (201):**
```json
{
  "id": 1,
  "usuario_id": 1,
  "nome_paciente": "João Silva",
  "documento": "123.456.789-00",
  "exame": "Consulta Cardiologia",
  "convenio": "BRADESCO",
  "data_atendimento": "2026-05-15T10:30:00",
  "data_envio": null,
  "data_faturamento": null,
  "data_recebimento": null,
  "created_at": "2026-05-19T12:00:00Z"
}
```

### 4. Listar Faturamentos com Filtros

```bash
curl "http://localhost:3001/faturamentos?page=1&status=nao_enviado&convenio=BRADESCO&order=desc" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Query Strings Disponíveis:**
- `page` - Número da página (padrão: 1)
- `status` - `nao_enviado`, `enviado`, `faturado`, `recebido`
- `convenio` - Nome do convênio (ex: BRADESCO, GEAP)
- `order` - `asc` ou `desc` (padrão: desc)

### 5. Atualizar Status de Faturamento

```bash
curl -X PATCH http://localhost:3001/faturamentos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "tipo": "envio"
  }'
```

**Tipos de Status:**
- `envio` - Marca como enviado
- `faturamento` - Marca como faturado (requer ter sido enviado)
- `recebimento` - Marca como recebido (requer ter sido faturado)

### 6. Obter Estatísticas

```bash
curl http://localhost:3001/faturamentos/stats \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta:**
```json
[
  {
    "nome": "BRADESCO",
    "precisaEnviar": 5,
    "enviados": 3,
    "faturados": 2,
    "recebidos": 1
  },
  {
    "nome": "GEAP",
    "precisaEnviar": 2,
    "enviados": 1,
    "faturados": 0,
    "recebidos": 0
  }
]
```

### 7. Deletar Faturamento

```bash
curl -X DELETE http://localhost:3001/faturamentos/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta (204):** Sem conteúdo

## 🔄 Fluxo do Ciclo de Faturamento

```
Não Enviado
    ↓
    └─→ PATCH /faturamentos/:id { "tipo": "envio" }
    ↓
Enviado
    ↓
    └─→ PATCH /faturamentos/:id { "tipo": "faturamento" }
    ↓
Faturado
    ↓
    └─→ PATCH /faturamentos/:id { "tipo": "recebimento" }
    ↓
Recebido ✅
```

## 🔑 Convênios Suportados

Atualmente, o sistema aceita os seguintes convênios:

- **BRADESCO**
- **GEAP**

Para adicionar novos convênios, atualize o array `conveniosValidos` em `src/controllers/FaturamentoController.ts`.

## 🛡️ Segurança

- ✅ Senhas criptografadas com bcryptjs
- ✅ Autenticação via JWT com expiração de 7 dias
- ✅ CORS configurado com whitelist de origens
- ✅ Helmet para headers de segurança HTTP
- ✅ Validação de entrada em todos os endpoints
- ✅ Isolamento de dados por usuário

## 🚨 Validações

### Faturamento
- ✅ Nome do paciente deve conter pelo menos uma letra
- ✅ Data de atendimento não pode ser futura
- ✅ Convênio deve estar na lista de convênios válidos
- ✅ Não permite duplicatas (mesmo documento, exame, data, usuário)

### Autenticação
- ✅ Email único por usuário
- ✅ Senha obrigatória (mínimo 6 caracteres recomendado)

## 📱 Acesso via React Native (Expo)

Se você estiver desenvolvendo um frontend em React Native com Expo:

```javascript
// Android Emulator (AVD)
const API_URL = 'http://10.0.2.2:3001';

// iOS Simulator
const API_URL = 'http://localhost:3001';

// Dispositivo Físico (mesma rede)
const API_URL = 'http://<SEU_IP_LOCAL>:3001';
// Exemplo: http://192.168.0.42:3001
```

## 🐛 Troubleshooting

### Erro de Conexão com Banco
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Verifique se PostgreSQL está rodando
- Confirme `DATABASE_URL` no `.env`
- Se usa Docker, execute `docker compose up -d`

### Token Inválido
```json
{"error": "Token inválido ou expirado"}
```
- Faça login novamente para obter novo token
- Verifique se `JWT_SECRET` está configurado

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
- Adicione sua origem em `allowedOrigins` no `src/server.ts`
- Reinicie a aplicação

## 📦 Estrutura de Dependências

### Dependências Principais
- `express` - Framework web
- `cors` - Middleware CORS
- `dotenv` - Variáveis de ambiente
- `pg` - Cliente PostgreSQL
- `jsonwebtoken` - JWT
- `bcryptjs` - Hash de senhas
- `helmet` - Segurança HTTP

### Dependências de Desenvolvimento
- `typescript` - Type safety
- `@types/node` - Tipos Node.js
- `@types/express` - Tipos Express
- `prettier` - Formatação
- `eslint` - Linting

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Glomes**

- GitHub: [@Glomes](https://github.com/Glomes)

## 🔮 Roadmap

- [ ] Relatório de faturamento em PDF
- [ ] Integração com webhooks de convênios
- [ ] Dashboard com gráficos avançados
- [ ] Suporte a mais convênios
- [ ] Notificações por email
- [ ] Documentação OpenAPI/Swagger
- [ ] Testes automatizados

## ⭐ Contribua

Se este projeto te ajudou, considere dar uma ⭐ no repositório!

---

**Desenvolvido com ❤️ para clínicas conveniadas**
