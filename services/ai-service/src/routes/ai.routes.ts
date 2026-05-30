import { Router } from 'express';
import { verifyJwt } from '../middleware/auth.middleware';
import {
  handleChat,
  handleSpendingAnalysis,
  handleExplainFraud,
  handleClearHistory,
  handleHealthCheck,
} from '../controllers/ai.controller';

const router = Router();

router.get('/health', handleHealthCheck);
router.post('/ai/chat', verifyJwt, handleChat);
router.get('/ai/analysis', verifyJwt, handleSpendingAnalysis);
router.post('/ai/explain-fraud', verifyJwt, handleExplainFraud);
router.delete('/ai/history/:sessionId', verifyJwt, handleClearHistory);

export default router;
