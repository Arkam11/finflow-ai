import { DataSource } from 'typeorm';
import { env } from './env';
import { logger } from './logger';
import { User } from '../entities/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.name,
  synchronize: env.nodeEnv === 'development',
  logging: env.nodeEnv === 'development',
  entities: [User],
  migrations: ['src/migrations/*.ts'],
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('PostgreSQL connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw error;
  }
};
