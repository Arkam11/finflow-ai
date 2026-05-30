import { Router } from 'express';
import { verifyJwt } from '../middleware/auth.middleware';
import {
  handleCreateTransaction,
  handleGetTransactions,
  handleGetTransactionById,
  handleHealthCheck,
} from '../controllers/transaction.controller';

const router = Router();

router.get('/health', handleHealthCheck);
router.post('/transactions', verifyJwt, handleCreateTransaction);
router.get('/transactions', verifyJwt, handleGetTransactions);
router.get('/transactions/:id', verifyJwt, handleGetTransactionById);

export default router;
