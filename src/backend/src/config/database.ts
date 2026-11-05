import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  logger.error('Error inesperado de la base de datos:', err);
});

export async function query(text: string, params?: unknown[]) {
  const result = await pool.query(text, params as never);
  return result;
}

export async function getClient() {
  return pool.connect();
}
