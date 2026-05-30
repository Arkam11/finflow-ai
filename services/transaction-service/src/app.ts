import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import transactionRoutes from './routes/transaction.routes';
import { logger } from './config/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', transactionRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

export default app;
