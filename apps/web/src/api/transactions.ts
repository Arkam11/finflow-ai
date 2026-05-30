import apiClient from './client';
import { Transaction, ApiResponse } from '../types';

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const res = await apiClient.get<ApiResponse<Transaction[]>>('/transactions');
  return res.data.data || [];
};

export const createTransaction = async (data: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  type: string;
  description?: string;
}): Promise<Transaction> => {
  const res = await apiClient.post<ApiResponse<Transaction>>('/transactions', data);
  return res.data.data!;
};
