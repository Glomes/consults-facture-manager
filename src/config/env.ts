import 'dotenv/config';

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`❌ Variável de ambiente ${name} não definida`);
  }

  return value;
}

export const JWT_SECRET: string = getEnv('JWT_SECRET');