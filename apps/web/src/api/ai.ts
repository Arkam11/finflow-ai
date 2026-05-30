import apiClient from './client';
import { ApiResponse, SpendingAnalysis } from '../types';
import { useAuthStore } from '../store/auth.store';

export const fetchSpendingAnalysis = async (): Promise<string> => {
  const res = await apiClient.get<ApiResponse<SpendingAnalysis>>('/ai/analysis');
  return res.data.data?.analysis || '';
};

export const streamChatMessage = (
  message: string,
  sessionId: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): (() => void) => {
  const token = useAuthStore.getState().accessToken;
  let cancelled = false;

  const run = async () => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, sessionId }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.chunk) onChunk(parsed.chunk);
            if (parsed.done) {
              onDone();
              return;
            }
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
          } catch {
            continue;
          }
        }
      }
    } catch (err) {
      if (!cancelled) onError('Connection failed');
    }
  };

  run();
  return () => {
    cancelled = true;
  };
};
