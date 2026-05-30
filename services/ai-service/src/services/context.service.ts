import { pool } from '../config/database';
import { TransactionContext, SpendingAnalysis } from '../types/ai.types';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const fetchUserTransactions = async (userId: string): Promise<TransactionContext[]> => {
  try {
    const result = await pool.query(
      `SELECT id, amount, currency, type, status, description,
              "riskScore", "isFlagged", "createdAt"
       FROM transactions
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2`,
      [userId, env.ai.maxContextTransactions],
    );
    return result.rows;
  } catch (error) {
    logger.warn('Could not fetch transactions for context', { userId, error });
    return [];
  }
};

export const buildTransactionContext = (transactions: TransactionContext[]): string => {
  if (transactions.length === 0) {
    return 'No transaction history available yet.';
  }

  const lines = transactions.map((tx) => {
    const flagged = tx.isFlagged ? ' [FLAGGED]' : '';
    const desc = tx.description ? ` - ${tx.description}` : '';
    return `• ${tx.createdAt.toString().slice(0, 10)} | ${tx.type} | ${tx.amount} ${tx.currency} | ${tx.status}${flagged}${desc}`;
  });

  return `Recent transactions (newest first):\n${lines.join('\n')}`;
};

export const analyzeSpending = (transactions: TransactionContext[]): SpendingAnalysis => {
  if (transactions.length === 0) {
    return {
      totalSpent: 0,
      totalReceived: 0,
      transactionCount: 0,
      flaggedCount: 0,
      topTransactionType: 'N/A',
      averageAmount: 0,
      currency: 'USD',
    };
  }

  const spent = transactions
    .filter((tx) => ['TRANSFER', 'PAYMENT', 'WITHDRAWAL'].includes(tx.type))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const received = transactions
    .filter((tx) => tx.type === 'DEPOSIT')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const flaggedCount = transactions.filter((tx) => tx.isFlagged).length;

  const typeCounts = transactions.reduce(
    (acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const avgAmount =
    transactions.reduce((sum, tx) => sum + Number(tx.amount), 0) / transactions.length;

  return {
    totalSpent: Math.round(spent * 100) / 100,
    totalReceived: Math.round(received * 100) / 100,
    transactionCount: transactions.length,
    flaggedCount,
    topTransactionType: topType,
    averageAmount: Math.round(avgAmount * 100) / 100,
    currency: transactions[0]?.currency || 'USD',
  };
};
