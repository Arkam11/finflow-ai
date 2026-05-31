import { env } from '../config/env';
import { logger } from '../config/logger';
import { getCached, setCached, invalidateCache } from './cache';
import { graphqlRequestCounter, graphqlRequestDuration, cacheHitCounter } from '../config/metrics';
import { TransactionData } from './loaders';

interface GqlContext {
  token?: string;
  userId?: string;
}

const serviceCall = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`Service error: ${response.status}`);
  const data = await response.json();
  return (data as { data: T }).data;
};

export const resolvers = {
  Query: {
    transactions: async (
      _: unknown,
      args: { limit?: number; offset?: number },
      ctx: GqlContext,
    ): Promise<TransactionData[]> => {
      const end = graphqlRequestDuration.startTimer({ operation: 'transactions' });
      const cacheKey = `gql:transactions:${ctx.userId}:${args.limit || 50}:${args.offset || 0}`;

      try {
        const cached = await getCached<TransactionData[]>(cacheKey);
        if (cached) {
          cacheHitCounter.inc({ type: 'graphql_transactions' });
          logger.debug('GraphQL cache hit', { cacheKey });
          end();
          return cached;
        }

        const data = await serviceCall<TransactionData[]>(
          `${env.services.transaction}/transactions`,
          { headers: { Authorization: `Bearer ${ctx.token}` } },
        );

        await setCached(cacheKey, data, 30);
        graphqlRequestCounter.inc({ operation: 'transactions', status: 'success' });
        end();
        return data;
      } catch (error) {
        graphqlRequestCounter.inc({ operation: 'transactions', status: 'error' });
        end();
        logger.error('GraphQL transactions resolver error', { error });
        throw error;
      }
    },

    transaction: async (
      _: unknown,
      args: { id: string },
      ctx: GqlContext,
    ): Promise<TransactionData | null> => {
      const end = graphqlRequestDuration.startTimer({ operation: 'transaction' });
      const cacheKey = `gql:transaction:${args.id}`;

      try {
        const cached = await getCached<TransactionData>(cacheKey);
        if (cached) {
          cacheHitCounter.inc({ type: 'graphql_transaction' });
          end();
          return cached;
        }

        const data = await serviceCall<TransactionData>(
          `${env.services.transaction}/transactions/${args.id}`,
          { headers: { Authorization: `Bearer ${ctx.token}` } },
        );

        await setCached(cacheKey, data, 60);
        end();
        return data;
      } catch (error) {
        end();
        logger.error('GraphQL transaction resolver error', { error });
        return null;
      }
    },

    transactionStats: async (_: unknown, __: unknown, ctx: GqlContext) => {
      const end = graphqlRequestDuration.startTimer({ operation: 'transactionStats' });
      const cacheKey = `gql:stats:${ctx.userId}`;

      try {
        const cached = await getCached<object>(cacheKey);
        if (cached) {
          cacheHitCounter.inc({ type: 'graphql_stats' });
          end();
          return cached;
        }

        const transactions = await serviceCall<TransactionData[]>(
          `${env.services.transaction}/transactions`,
          { headers: { Authorization: `Bearer ${ctx.token}` } },
        );

        const spent = transactions
          .filter((tx) => ['TRANSFER', 'PAYMENT', 'WITHDRAWAL'].includes(tx.type))
          .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const received = transactions
          .filter((tx) => tx.type === 'DEPOSIT')
          .reduce((sum, tx) => sum + Number(tx.amount), 0);

        const stats = {
          totalCount: transactions.length,
          totalSpent: Math.round(spent * 100) / 100,
          totalReceived: Math.round(received * 100) / 100,
          flaggedCount: transactions.filter((tx) => tx.isFlagged).length,
          averageAmount:
            transactions.length > 0
              ? Math.round(
                  (transactions.reduce((s, tx) => s + Number(tx.amount), 0) / transactions.length) *
                    100,
                ) / 100
              : 0,
        };

        await setCached(cacheKey, stats, 60);
        end();
        return stats;
      } catch (error) {
        end();
        throw error;
      }
    },

    spendingAnalysis: async (_: unknown, __: unknown, ctx: GqlContext) => {
      const end = graphqlRequestDuration.startTimer({ operation: 'spendingAnalysis' });
      const cacheKey = `gql:analysis:${ctx.userId}`;

      try {
        const cached = await getCached<{ analysis: string; generatedAt: string }>(cacheKey);
        if (cached) {
          cacheHitCounter.inc({ type: 'graphql_analysis' });
          end();
          return cached;
        }

        const data = await serviceCall<{ analysis: string }>(`${env.services.ai}/ai/analysis`, {
          headers: { Authorization: `Bearer ${ctx.token}` },
        });

        const result = { analysis: data.analysis, generatedAt: new Date().toISOString() };
        await setCached(cacheKey, result, 300);
        end();
        return result;
      } catch (error) {
        end();
        throw error;
      }
    },

    gatewayHealth: async () => {
      const serviceNames = ['auth', 'account', 'transaction', 'ai', 'analytics', 'retail'] as const;
      const urls = [
        `${env.services.auth}/auth/health`,
        `${env.services.account}/health`,
        `${env.services.transaction}/health`,
        `${env.services.ai}/health`,
        `${env.services.analytics}/health`,
        `${env.services.retail}/health`,
      ];

      const checks = await Promise.allSettled(
        urls.map(async (url, i) => {
          const start = Date.now();
          try {
            const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
            return {
              name: serviceNames[i],
              status: res.ok ? 'healthy' : 'unhealthy',
              responseTime: Date.now() - start,
            };
          } catch {
            return { name: serviceNames[i], status: 'unreachable', responseTime: null };
          }
        }),
      );

      const services = checks.map((r) =>
        r.status === 'fulfilled'
          ? r.value
          : { name: 'unknown', status: 'unreachable', responseTime: null },
      );

      const allHealthy = services.every((s) => s.status === 'healthy');
      const anyHealthy = services.some((s) => s.status === 'healthy');

      return {
        status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
        services,
        timestamp: new Date().toISOString(),
      };
    },
  },

  Mutation: {
    createTransaction: async (
      _: unknown,
      args: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        currency: string;
        type: string;
        description?: string;
      },
      ctx: GqlContext,
    ): Promise<TransactionData> => {
      const end = graphqlRequestDuration.startTimer({ operation: 'createTransaction' });

      try {
        const data = await serviceCall<TransactionData>(
          `${env.services.transaction}/transactions`,
          {
            method: 'POST',
            body: JSON.stringify(args),
            headers: { Authorization: `Bearer ${ctx.token}` },
          },
        );

        await invalidateCache(`gql:transactions:${ctx.userId}:*`);
        await invalidateCache(`gql:stats:${ctx.userId}`);

        graphqlRequestCounter.inc({ operation: 'createTransaction', status: 'success' });
        end();
        return data;
      } catch (error) {
        graphqlRequestCounter.inc({ operation: 'createTransaction', status: 'error' });
        end();
        throw error;
      }
    },
  },
};
