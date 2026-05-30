import { buildTransactionContext, analyzeSpending } from '../services/context.service';
import { TransactionContext } from '../types/ai.types';

const mockTransactions = (): TransactionContext[] => [
  {
    id: 'tx-001',
    amount: 500,
    currency: 'USD',
    type: 'TRANSFER',
    status: 'COMPLETED',
    description: 'Rent payment',
    riskScore: 0,
    isFlagged: false,
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'tx-002',
    amount: 75000,
    currency: 'USD',
    type: 'TRANSFER',
    status: 'COMPLETED',
    description: 'Large transfer',
    riskScore: 70,
    isFlagged: true,
    createdAt: '2026-05-02T10:00:00.000Z',
  },
  {
    id: 'tx-003',
    amount: 2000,
    currency: 'USD',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    description: 'Salary',
    riskScore: 0,
    isFlagged: false,
    createdAt: '2026-05-03T10:00:00.000Z',
  },
];

describe('Context Service', () => {
  describe('buildTransactionContext', () => {
    it('should return placeholder when no transactions', () => {
      const result = buildTransactionContext([]);
      expect(result).toBe('No transaction history available yet.');
    });

    it('should format transactions correctly', () => {
      const result = buildTransactionContext(mockTransactions());
      expect(result).toContain('TRANSFER');
      expect(result).toContain('500');
      expect(result).toContain('DEPOSIT');
      expect(result).toContain('[FLAGGED]');
    });

    it('should mark flagged transactions', () => {
      const result = buildTransactionContext(mockTransactions());
      expect(result).toContain('[FLAGGED]');
    });

    it('should include description when present', () => {
      const result = buildTransactionContext(mockTransactions());
      expect(result).toContain('Rent payment');
    });
  });

  describe('analyzeSpending', () => {
    it('should return zeros for empty transactions', () => {
      const result = analyzeSpending([]);
      expect(result.totalSpent).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.topTransactionType).toBe('N/A');
    });

    it('should calculate total spent correctly', () => {
      const result = analyzeSpending(mockTransactions());
      expect(result.totalSpent).toBe(75500);
    });

    it('should calculate total received correctly', () => {
      const result = analyzeSpending(mockTransactions());
      expect(result.totalReceived).toBe(2000);
    });

    it('should count flagged transactions', () => {
      const result = analyzeSpending(mockTransactions());
      expect(result.flaggedCount).toBe(1);
    });

    it('should identify most common transaction type', () => {
      const result = analyzeSpending(mockTransactions());
      expect(result.topTransactionType).toBe('TRANSFER');
    });

    it('should calculate average amount', () => {
      const result = analyzeSpending(mockTransactions());
      expect(result.averageAmount).toBeGreaterThan(0);
    });

    it('should report correct transaction count', () => {
      const result = analyzeSpending(mockTransactions());
      expect(result.transactionCount).toBe(3);
    });
  });
});
