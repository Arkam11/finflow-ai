import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { env } from '../config/env';
import { logger } from '../config/logger';
import {
  KafkaTopic,
  KafkaEvent,
  TransactionCreatedPayload,
  TransactionFailedPayload,
  FraudAlertPayload,
} from '../types/events';
import {
  sendTransactionConfirmation,
  sendTransactionFailedAlert,
  sendFraudAlert,
} from '../services/notification.service';

const kafka = new Kafka({
  clientId: env.kafka.clientId,
  brokers: env.kafka.brokers,
  logLevel: logLevel.WARN,
  retry: { initialRetryTime: 300, retries: 10 },
});

let consumer: Consumer | null = null;

const handleMessage = async ({ topic, message }: EachMessagePayload): Promise<void> => {
  if (!message.value) return;

  try {
    const raw = JSON.parse(message.value.toString());

    switch (topic) {
      case KafkaTopic.TRANSACTION_CREATED: {
        const event = raw as KafkaEvent<TransactionCreatedPayload>;
        await sendTransactionConfirmation(event.payload);
        break;
      }
      case KafkaTopic.TRANSACTION_FAILED: {
        const event = raw as KafkaEvent<TransactionFailedPayload>;
        await sendTransactionFailedAlert(event.payload);
        break;
      }
      case KafkaTopic.FRAUD_ALERT: {
        const event = raw as KafkaEvent<FraudAlertPayload>;
        await sendFraudAlert(event.payload);
        break;
      }
      default:
        logger.warn('Unknown topic received', { topic });
    }
  } catch (error) {
    logger.error('Failed to process Kafka message', { topic, error });
  }
};

export const startConsumer = async (): Promise<void> => {
  consumer = kafka.consumer({ groupId: env.kafka.groupId });

  await consumer.connect();
  logger.info('Kafka consumer connected');

  await consumer.subscribe({
    topics: [KafkaTopic.TRANSACTION_CREATED, KafkaTopic.TRANSACTION_FAILED, KafkaTopic.FRAUD_ALERT],
    fromBeginning: false,
  });

  await consumer.run({ eachMessage: handleMessage });
  logger.info(
    'Kafka consumer listening on topics: transaction.created, transaction.failed, fraud.alert',
  );
};

export const stopConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    logger.info('Kafka consumer disconnected');
  }
};
