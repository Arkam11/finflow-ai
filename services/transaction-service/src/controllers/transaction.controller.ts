import { Request, Response } from 'express';
import {
  createTransaction,
  getTransactionsByUser,
  getTransactionById,
} from '../services/transaction.service';
import { CreateTransactionDto, JwtPayload } from '../types/transaction.types';
import { logger } from '../config/logger';

interface AuthRequest extends Request {
  jwtUser?: JwtPayload;
}

export const handleCreateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.jwtUser?.sub;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const dto = req.body as CreateTransactionDto;

    if (!dto.fromAccountId || !dto.toAccountId || !dto.amount || !dto.currency || !dto.type) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    if (dto.amount <= 0) {
      res.status(400).json({ success: false, error: 'Amount must be positive' });
      return;
    }

    const transaction = await createTransaction(dto, userId);
    res.status(201).json({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Create transaction failed', { error });
    res.status(500).json({ success: false, error: 'Transaction failed' });
  }
};

export const handleGetTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.jwtUser?.sub;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const transactions = await getTransactionsByUser(userId);
    res.json({ success: true, data: transactions, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Get transactions failed', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
};

export const handleGetTransactionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.jwtUser?.sub;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const tx = await getTransactionById(req.params.id, userId);
    if (!tx) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }
    res.json({ success: true, data: tx, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Get transaction by id failed', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
};

export const handleHealthCheck = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: { status: 'healthy', service: 'transaction-service' },
    timestamp: new Date().toISOString(),
  });
};
