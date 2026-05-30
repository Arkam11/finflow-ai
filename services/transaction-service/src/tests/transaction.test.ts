import { checkFraud } from '../utils/fraud.detector';
import { TransactionType, Currency } from '../types/transaction.types';

describe('Fraud Detector', () => {
  const baseDto = {
    fromAccountId: 'acc-001',
    toAccountId: 'acc-002',
    amount: 100,
    currency: Currency.USD,
    type: TransactionType.TRANSFER,
  };

  it('should return low risk for normal transaction', () => {
    const result = checkFraud({ ...baseDto, amount: 100 });
    expect(result.riskScore).toBe(0);
    expect(result.isFlagged).toBe(false);
  });

  it('should flag high value transaction above 10000', () => {
    const result = checkFraud({ ...baseDto, amount: 15000 });
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.reason).toContain('High value transaction');
  });

  it('should flag suspicious transaction above 50000', () => {
    const result = checkFraud({ ...baseDto, amount: 75000 });
    expect(result.riskScore).toBeGreaterThanOrEqual(60);
    expect(result.isFlagged).toBe(true);
  });

  it('should add risk score for same account transfer', () => {
    const result = checkFraud({ ...baseDto, fromAccountId: 'acc-001', toAccountId: 'acc-001' });
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.reason).toContain('Same account transfer');
  });

  it('should flag round number high-value transaction', () => {
    const result = checkFraud({ ...baseDto, amount: 5000 });
    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.reason).toContain('Round number');
  });

  it('should cap risk score at 100', () => {
    const result = checkFraud({
      ...baseDto,
      amount: 100000,
      fromAccountId: 'acc-same',
      toAccountId: 'acc-same',
    });
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.isFlagged).toBe(true);
  });
});

describe('Transaction types', () => {
  it('should have correct TransactionType values', () => {
    expect(TransactionType.TRANSFER).toBe('TRANSFER');
    expect(TransactionType.DEPOSIT).toBe('DEPOSIT');
    expect(TransactionType.WITHDRAWAL).toBe('WITHDRAWAL');
    expect(TransactionType.PAYMENT).toBe('PAYMENT');
  });

  it('should have correct Currency values', () => {
    expect(Currency.USD).toBe('USD');
    expect(Currency.EUR).toBe('EUR');
    expect(Currency.AED).toBe('AED');
  });
});
