export enum TransactionType {
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  FLAGGED = 'FLAGGED',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  AED = 'AED',
}

export interface CreateTransactionDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  description?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
}
