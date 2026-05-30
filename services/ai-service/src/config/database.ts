import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  max: 5,
});

pool.on('error', (err) => logger.error('Postgres pool error', { err }));

export const connectDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  client.release();
  logger.info('PostgreSQL connected successfully');
};
