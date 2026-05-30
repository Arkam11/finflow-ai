import {
  sendTransactionConfirmation,
  sendTransactionFailedAlert,
  sendFraudAlert,
} from '../services/notification.service';

describe('Notification Service', () => {
  const txPayload = {
    transactionId: 'tx-001',
    fromAccountId: 'acc-001',
    toAccountId: 'acc-002',
    amount: 500,
    currency: 'USD',
    type: 'TRANSFER',
    userId: 'user-001',
  };

  it('should send transaction confirmation without throwing', async () => {
    await expect(sendTransactionConfirmation(txPayload)).resolves.not.toThrow();
  });

  it('should send transaction failed alert without throwing', async () => {
    await expect(
      sendTransactionFailedAlert({
        transactionId: 'tx-002',
        userId: 'user-001',
        reason: 'Insufficient funds',
        amount: 1000,
      }),
    ).resolves.not.toThrow();
  });

  it('should send fraud alert without throwing', async () => {
    await expect(
      sendFraudAlert({
        transactionId: 'tx-003',
        userId: 'user-001',
        riskScore: 85,
        reason: 'Amount exceeds suspicious threshold',
        amount: 75000,
      }),
    ).resolves.not.toThrow();
  });
});
