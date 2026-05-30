import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback_secret',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380', 10),
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    user: process.env.DB_USER || 'finflow',
    password: process.env.DB_PASSWORD || 'finflow_secret',
    name: process.env.DB_NAME || 'finflow_db',
  },

  ai: {
    maxContextTransactions: parseInt(process.env.MAX_CONTEXT_TRANSACTIONS || '20', 10),
    chatHistoryTtl: parseInt(process.env.CHAT_HISTORY_TTL || '3600', 10),
  },
};
