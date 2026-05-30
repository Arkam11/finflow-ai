import { logger } from '../config/logger';
import {
  TransactionCreatedPayload,
  TransactionFailedPayload,
  FraudAlertPayload,
} from '../types/events';

export const sendTransactionConfirmation = async (
  payload: TransactionCreatedPayload,
): Promise<void> => {
  logger.info('NOTIFICATION: Transaction confirmation', {
    to: `user:${payload.userId}`,
    subject: 'Transaction Completed',
    message: `Your ${payload.type} of ${payload.amount} ${payload.currency} was completed successfully.`,
    transactionId: payload.transactionId,
  });
};

export const sendTransactionFailedAlert = async (
  payload: TransactionFailedPayload,
): Promise<void> => {
  logger.warn('NOTIFICATION: Transaction failed alert', {
    to: `user:${payload.userId}`,
    subject: 'Transaction Failed',
    message: `Your transaction of ${payload.amount} failed. Reason: ${payload.reason}`,
    transactionId: payload.transactionId,
  });
};

export const sendFraudAlert = async (payload: FraudAlertPayload): Promise<void> => {
  logger.error('NOTIFICATION: FRAUD ALERT', {
    to: `user:${payload.userId}`,
    subject: '⚠️ Suspicious Activity Detected',
    message: `A transaction of ${payload.amount} has been flagged. Risk score: ${payload.riskScore}. Reason: ${payload.reason}`,
    transactionId: payload.transactionId,
    riskScore: payload.riskScore,
  });
};
