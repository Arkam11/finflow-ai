import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TransactionType, TransactionStatus, Currency } from '../types/transaction.types';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  fromAccountId!: string;

  @Index()
  @Column()
  toAccountId!: string;

  @Index()
  @Column()
  userId!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.USD })
  currency!: Currency;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status!: TransactionStatus;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  failureReason?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  riskScore!: number;

  @Column({ default: false })
  isFlagged!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
