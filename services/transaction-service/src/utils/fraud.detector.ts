import { CreateTransactionDto } from '../types/transaction.types';

export interface FraudCheckResult {
  riskScore: number;
  isFlagged: boolean;
  reason?: string;
}

const HIGH_VALUE_THRESHOLD = 10000;
const SUSPICIOUS_THRESHOLD = 50000;

export const checkFraud = (dto: CreateTransactionDto): FraudCheckResult => {
  let riskScore = 0;
  const reasons: string[] = [];

  if (dto.amount > SUSPICIOUS_THRESHOLD) {
    riskScore += 60;
    reasons.push('Amount exceeds suspicious threshold');
  } else if (dto.amount > HIGH_VALUE_THRESHOLD) {
    riskScore += 30;
    reasons.push('High value transaction');
  }

  if (dto.fromAccountId === dto.toAccountId) {
    riskScore += 20;
    reasons.push('Same account transfer');
  }

  if (dto.amount % 1000 === 0 && dto.amount >= 5000) {
    riskScore += 10;
    reasons.push('Round number high-value transaction');
  }

  const isFlagged = riskScore >= 50;

  return {
    riskScore: Math.min(riskScore, 100),
    isFlagged,
    reason: reasons.join('; ') || undefined,
  };
};
