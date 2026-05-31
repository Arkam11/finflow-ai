import DataLoader from 'dataloader';
import { logger } from '../config/logger';

export interface TransactionData {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  userId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description?: string;
  riskScore: number;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createTransactionLoader = (
  fetchFn: (ids: readonly string[]) => Promise<TransactionData[]>,
) =>
  new DataLoader<string, TransactionData | null>(
    async (ids) => {
      logger.debug('DataLoader batching transaction fetch', { count: ids.length });
      const transactions = await fetchFn(ids);
      const txMap = new Map(transactions.map((tx) => [tx.id, tx]));
      return ids.map((id) => txMap.get(id) ?? null);
    },
    { cache: true, maxBatchSize: 100 },
  );
