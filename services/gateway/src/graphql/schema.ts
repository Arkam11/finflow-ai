export const typeDefs = `#graphql
  enum TransactionType {
    TRANSFER
    DEPOSIT
    WITHDRAWAL
    PAYMENT
  }

  enum TransactionStatus {
    PENDING
    COMPLETED
    FAILED
    FLAGGED
  }

  enum Currency {
    USD
    EUR
    GBP
    AED
  }

  type Transaction {
    id: ID!
    fromAccountId: String!
    toAccountId: String!
    userId: String!
    amount: Float!
    currency: Currency!
    type: TransactionType!
    status: TransactionStatus!
    description: String
    riskScore: Float!
    isFlagged: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type TransactionStats {
    totalCount: Int!
    totalSpent: Float!
    totalReceived: Float!
    flaggedCount: Int!
    averageAmount: Float!
  }

  type SpendingAnalysis {
    analysis: String!
    generatedAt: String!
  }

  type ServiceHealth {
    name: String!
    status: String!
    responseTime: Int
  }

  type GatewayHealth {
    status: String!
    services: [ServiceHealth!]!
    timestamp: String!
  }

  type Query {
    transactions(limit: Int, offset: Int): [Transaction!]!
    transaction(id: ID!): Transaction
    transactionStats: TransactionStats!
    spendingAnalysis: SpendingAnalysis!
    gatewayHealth: GatewayHealth!
  }

  type Mutation {
    createTransaction(
      fromAccountId: String!
      toAccountId: String!
      amount: Float!
      currency: Currency!
      type: TransactionType!
      description: String
    ): Transaction!
  }
`;
