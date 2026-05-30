import { AppDataSource } from '../config/database';
import { publishEvent, KafkaTopic } from '../config/kafka';
import { Transaction } from '../entities/Transaction';
import { CreateTransactionDto, TransactionStatus } from '../types/transaction.types';
import { checkFraud } from '../utils/fraud.detector';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

const repo = () => AppDataSource.getRepository(Transaction);

export const createTransaction = async (
  dto: CreateTransactionDto,
  userId: string,
): Promise<Transaction> => {
  const fraudResult = checkFraud(dto);

  const tx = repo().create({
    ...dto,
    userId,
    status: TransactionStatus.PENDING,
    riskScore: fraudResult.riskScore,
    isFlagged: fraudResult.isFlagged,
  });

  await repo().save(tx);
  logger.info('Transaction created', { id: tx.id, amount: dto.amount, userId });

  if (fraudResult.isFlagged) {
    await publishEvent(KafkaTopic.FRAUD_ALERT, {
      eventId: uuidv4(),
      eventType: KafkaTopic.FRAUD_ALERT,
      timestamp: new Date().toISOString(),
      payload: {
        transactionId: tx.id,
        userId,
        riskScore: fraudResult.riskScore,
        reason: fraudResult.reason || 'Suspicious activity detected',
        amount: dto.amount,
      },
    });
    logger.warn('Fraud alert published', {
      transactionId: tx.id,
      riskScore: fraudResult.riskScore,
    });
  }

  tx.status = TransactionStatus.COMPLETED;
  await repo().save(tx);

  await publishEvent(KafkaTopic.TRANSACTION_CREATED, {
    eventId: uuidv4(),
    eventType: KafkaTopic.TRANSACTION_CREATED,
    timestamp: new Date().toISOString(),
    payload: {
      transactionId: tx.id,
      fromAccountId: tx.fromAccountId,
      toAccountId: tx.toAccountId,
      amount: dto.amount,
      currency: dto.currency,
      type: dto.type,
      userId,
    },
  });

  return tx;
};

export const getTransactionsByUser = async (userId: string): Promise<Transaction[]> => {
  return repo().find({
    where: { userId },
    order: { createdAt: 'DESC' },
    take: 50,
  });
};

export const getTransactionById = async (
  id: string,
  userId: string,
): Promise<Transaction | null> => {
  return repo().findOne({ where: { id, userId } });
};
