import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { streamChat, generateSpendingAnalysis, explainFraudAlert } from '../services/ai.service';
import { clearChatHistory } from '../services/history.service';
import { JwtPayload } from '../types/ai.types';
import { logger } from '../config/logger';

interface AuthRequest extends Request {
  jwtUser?: JwtPayload;
}

export const handleChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.jwtUser?.sub;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { message, sessionId } = req.body as { message: string; sessionId?: string };

  if (!message?.trim()) {
    res.status(400).json({ success: false, error: 'Message is required' });
    return;
  }

  const session = sessionId || uuidv4();
  logger.info('Chat request received', { userId, sessionId: session });

  await streamChat(userId, session, message, res);
};

export const handleSpendingAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.jwtUser?.sub;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const analysis = await generateSpendingAnalysis(userId);
    res.json({
      success: true,
      data: { analysis },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Spending analysis failed', { error });
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
};

export const handleExplainFraud = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.jwtUser?.sub;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { transactionId, riskScore, reason, amount, currency } = req.body as {
    transactionId: string;
    riskScore: number;
    reason: string;
    amount: number;
    currency: string;
  };

  if (!transactionId || !riskScore || !reason || !amount) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  try {
    const explanation = await explainFraudAlert(
      transactionId,
      riskScore,
      reason,
      amount,
      currency || 'USD',
    );
    res.json({
      success: true,
      data: { explanation },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Fraud explanation failed', { error });
    res.status(500).json({ success: false, error: 'Explanation failed' });
  }
};

export const handleClearHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.jwtUser?.sub;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { sessionId } = req.params;
  await clearChatHistory(sessionId);
  res.json({ success: true, data: { cleared: true }, timestamp: new Date().toISOString() });
};

export const handleHealthCheck = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: { status: 'healthy', service: 'ai-service' },
    timestamp: new Date().toISOString(),
  });
};
