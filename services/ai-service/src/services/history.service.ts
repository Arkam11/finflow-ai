import { redis } from '../config/redis';
import { ChatMessage } from '../types/ai.types';
import { env } from '../config/env';
import { logger } from '../config/logger';

const historyKey = (sessionId: string) => `chat:history:${sessionId}`;

export const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const raw = await redis.get(historyKey(sessionId));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch (error) {
    logger.warn('Failed to get chat history', { sessionId, error });
    return [];
  }
};

export const appendChatHistory = async (
  sessionId: string,
  messages: ChatMessage[],
): Promise<void> => {
  try {
    const existing = await getChatHistory(sessionId);
    const updated = [...existing, ...messages].slice(-20);
    await redis.setex(historyKey(sessionId), env.ai.chatHistoryTtl, JSON.stringify(updated));
  } catch (error) {
    logger.warn('Failed to save chat history', { sessionId, error });
  }
};

export const clearChatHistory = async (sessionId: string): Promise<void> => {
  await redis.del(historyKey(sessionId));
};
