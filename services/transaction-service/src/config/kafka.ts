import { Kafka, Producer, CompressionTypes, logLevel } from 'kafkajs';
import { env } from './env';
import { logger } from './logger';

export enum KafkaTopic {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_FAILED = 'transaction.failed',
  FRAUD_ALERT = 'fraud.alert',
  ACCOUNT_UPDATED = 'account.updated',
}

export interface TransactionCreatedEvent {
  eventId: string;
  eventType: KafkaTopic.TRANSACTION_CREATED;
  timestamp: string;
  payload: {
    transactionId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    currency: string;
    type: string;
    userId: string;
  };
}

export interface TransactionFailedEvent {
  eventId: string;
  eventType: KafkaTopic.TRANSACTION_FAILED;
  timestamp: string;
  payload: {
    transactionId: string;
    userId: string;
    reason: string;
    amount: number;
  };
}

export interface FraudAlertEvent {
  eventId: string;
  eventType: KafkaTopic.FRAUD_ALERT;
  timestamp: string;
  payload: {
    transactionId: string;
    userId: string;
    riskScore: number;
    reason: string;
    amount: number;
  };
}

export type KafkaEvent = TransactionCreatedEvent | TransactionFailedEvent | FraudAlertEvent;

const kafka = new Kafka({
  clientId: env.kafka.clientId,
  brokers: env.kafka.brokers,
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

let producer: Producer | null = null;

export const getProducer = async (): Promise<Producer> => {
  if (!producer) {
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    await producer.connect();
    logger.info('Kafka producer connected');
  }
  return producer;
};

export const publishEvent = async (topic: KafkaTopic, event: KafkaEvent): Promise<void> => {
  const prod = await getProducer();
  await prod.send({
    topic,
    compression: CompressionTypes.GZIP,
    messages: [
      {
        key: event.payload.transactionId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          timestamp: event.timestamp,
        },
      },
    ],
  });
  logger.info('Kafka event published', { topic, eventId: event.eventId });
};

export const disconnectProducer = async (): Promise<void> => {
  if (producer) {
    await producer.disconnect();
    producer = null;
    logger.info('Kafka producer disconnected');
  }
};

export { kafka };
