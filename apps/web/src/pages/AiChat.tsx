import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import { streamChatMessage } from '../api/ai';
import { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

const SESSION_ID = `session-${Date.now()}`;

const SUGGESTIONS = [
  'Summarize my recent transactions',
  'Flag anything suspicious in my history',
  'What is my most common transaction type?',
  'Explain my largest transaction',
];

export const AiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm FinFlow AI. I have access to your transaction history and can help you analyze spending patterns, explain flagged transactions, and answer questions about your account. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const assistantMsgId = uuidv4();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    const cancel = streamChatMessage(
      text.trim(),
      SESSION_ID,
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m)),
        );
      },
      () => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m)),
        );
        setIsStreaming(false);
      },
      (err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: `Error: ${err}`, isStreaming: false } : m,
          ),
        );
        setIsStreaming(false);
      },
    );

    cancelRef.current = cancel;
  };

  const handleClear = () => {
    if (cancelRef.current) cancelRef.current();
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Chat cleared. How can I help you?',
        timestamp: new Date(),
      },
    ]);
    setIsStreaming(false);
  };

  return (
    <Box className="flex flex-col h-full" sx={{ maxHeight: 'calc(100vh - 48px)' }}>
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center gap-2">
          <SmartToyIcon sx={{ color: '#3b82f6', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="#1e293b">
              AI Assistant
            </Typography>
            <Box className="flex items-center gap-2">
              <Chip
                label="llama-3.3-70b"
                size="small"
                sx={{ height: 18, fontSize: 10, bgcolor: '#eff6ff', color: '#3b82f6' }}
              />
              <Chip
                label="RAG enabled"
                size="small"
                sx={{ height: 18, fontSize: 10, bgcolor: '#f0fdf4', color: '#10b981' }}
              />
            </Box>
          </Box>
        </Box>
        <IconButton onClick={handleClear} size="small" title="Clear chat">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className="flex gap-2 mb-3 flex-wrap">
        {SUGGESTIONS.map((s) => (
          <Chip
            key={s}
            label={s}
            size="small"
            onClick={() => sendMessage(s)}
            disabled={isStreaming}
            sx={{
              cursor: 'pointer',
              '&:hover': { bgcolor: '#dbeafe' },
              bgcolor: '#f8fafc',
              fontSize: 11,
            }}
          />
        ))}
      </Box>

      <Card
        sx={{
          flex: 1,
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              className={`flex gap-3 mb-4 chat-message ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Box
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                sx={{ bgcolor: msg.role === 'assistant' ? '#eff6ff' : '#1e293b' }}
              >
                {msg.role === 'assistant' ? (
                  <SmartToyIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                ) : (
                  <PersonIcon sx={{ fontSize: 16, color: 'white' }} />
                )}
              </Box>
              <Box
                className="max-w-[80%] rounded-2xl px-4 py-3"
                sx={{
                  bgcolor: msg.role === 'user' ? '#1e293b' : '#f8fafc',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : undefined,
                }}
              >
                {msg.content === '' && msg.isStreaming ? (
                  <CircularProgress size={16} />
                ) : (
                  <Typography
                    variant="body2"
                    color={msg.role === 'user' ? 'white' : '#1e293b'}
                    sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
                  >
                    {msg.content}
                    {msg.isStreaming && <span className="sse-cursor" />}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
          <div ref={bottomRef} />
        </Box>

        <CardContent sx={{ borderTop: '1px solid #f1f5f9', pt: 2, pb: '16px !important' }}>
          <Box className="flex gap-2">
            <TextField
              fullWidth
              placeholder="Ask about your transactions, spending patterns, fraud alerts..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              disabled={isStreaming}
              size="small"
              variant="outlined"
              multiline
              maxRows={3}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <IconButton
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              sx={{
                bgcolor: '#3b82f6',
                color: 'white',
                borderRadius: 2,
                '&:hover': { bgcolor: '#2563eb' },
                '&:disabled': { bgcolor: '#e2e8f0' },
                alignSelf: 'flex-end',
              }}
            >
              {isStreaming ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
