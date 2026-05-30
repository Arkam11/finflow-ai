export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface TransactionContext {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description?: string;
  riskScore: number;
  isFlagged: boolean;
  createdAt: string;
}

export interface SpendingAnalysis {
  totalSpent: number;
  totalReceived: number;
  transactionCount: number;
  flaggedCount: number;
  topTransactionType: string;
  averageAmount: number;
  currency: string;
}
