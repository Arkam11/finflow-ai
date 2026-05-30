export enum KafkaTopic {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_FAILED = 'transaction.failed',
  FRAUD_ALERT = 'fraud.alert',
}

export interface TransactionCreatedPayload {
  transactionId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  type: string;
  userId: string;
}

export interface TransactionFailedPayload {
  transactionId: string;
  userId: string;
  reason: string;
  amount: number;
}

export interface FraudAlertPayload {
  transactionId: string;
  userId: string;
  riskScore: number;
  reason: string;
  amount: number;
}

export interface KafkaEvent<T> {
  eventId: string;
  eventType: string;
  timestamp: string;
  payload: T;
}
