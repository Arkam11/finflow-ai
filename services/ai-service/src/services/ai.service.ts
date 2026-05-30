import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ChatMessage } from '../types/ai.types';
import { getChatHistory, appendChatHistory } from './history.service';
import { fetchUserTransactions, buildTransactionContext, analyzeSpending } from './context.service';

const client = new Anthropic({ apiKey: env.anthropic.apiKey });

const SYSTEM_PROMPT = `You are FinFlow AI, an expert personal financial assistant embedded in a banking platform.
You have access to the user's real transaction history which is injected into every conversation as context.
Your role is to:
- Analyze spending patterns and provide actionable financial insights
- Explain flagged or suspicious transactions in plain English
- Answer questions about account activity clearly and concisely
- Provide budgeting advice based on actual transaction data
- Alert users about unusual patterns you notice in their history

Always be:
- Precise with numbers (use the exact amounts from transactions)
- Proactive about flagged transactions (mention them if relevant)
- Concise but thorough — users are busy professionals
- Honest if you don't have enough data to answer accurately

Never make up transaction data. Only refer to what is provided in the context.`;

export const streamChat = async (
  userId: string,
  sessionId: string,
  userMessage: string,
  res: Response,
): Promise<void> => {
  const [history, transactions] = await Promise.all([
    getChatHistory(sessionId),
    fetchUserTransactions(userId),
  ]);

  const txContext = buildTransactionContext(transactions);

  const contextualSystemPrompt = `${SYSTEM_PROMPT}

--- USER TRANSACTION CONTEXT ---
${txContext}
--- END CONTEXT ---

Use the above transaction data to answer the user's questions accurately.`;

  const messages: ChatMessage[] = [...history, { role: 'user', content: userMessage }];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let fullResponse = '';

  try {
    const stream = client.messages.stream({
      model: env.anthropic.model,
      max_tokens: 1024,
      system: contextualSystemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text;
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    await appendChatHistory(sessionId, [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: fullResponse },
    ]);

    logger.info('Chat stream completed', {
      userId,
      sessionId,
      responseLength: fullResponse.length,
    });
  } catch (error) {
    logger.error('Claude API error', { error });
    res.write(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`);
    res.end();
  }
};

export const generateSpendingAnalysis = async (userId: string): Promise<string> => {
  const transactions = await fetchUserTransactions(userId);
  const analysis = analyzeSpending(transactions);
  const txContext = buildTransactionContext(transactions);

  if (transactions.length === 0) {
    return 'No transaction data available yet. Make some transactions to get spending insights.';
  }

  const prompt = `Based on this transaction data, provide a concise spending analysis in 3-4 bullet points.
Focus on: total spending vs income, flagged transactions if any, and one actionable tip.

${txContext}

Summary stats:
- Total spent: ${analysis.totalSpent} ${analysis.currency}
- Total received: ${analysis.totalReceived} ${analysis.currency}
- Transaction count: ${analysis.transactionCount}
- Flagged transactions: ${analysis.flaggedCount}
- Most common type: ${analysis.topTransactionType}
- Average transaction: ${analysis.averageAmount} ${analysis.currency}`;

  const response = await client.messages.create({
    model: env.anthropic.model,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : 'Unable to generate analysis.';
};

export const explainFraudAlert = async (
  transactionId: string,
  riskScore: number,
  reason: string,
  amount: number,
  currency: string,
): Promise<string> => {
  const prompt = `Explain this fraud alert to a banking customer in plain, non-technical English (2-3 sentences max).
Be reassuring but clear about what happened and what they should do.

Transaction ID: ${transactionId}
Amount: ${amount} ${currency}
Risk Score: ${riskScore}/100
Reason: ${reason}`;

  const response = await client.messages.create({
    model: env.anthropic.model,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : 'Unable to explain fraud alert.';
};
