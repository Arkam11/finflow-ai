import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { fetchTransactions } from '../api/transactions';
import { fetchSpendingAnalysis } from '../api/ai';
import { useAuthStore } from '../store/auth.store';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const { data: analysis, isLoading: aiLoading } = useQuery({
    queryKey: ['spending-analysis'],
    queryFn: fetchSpendingAnalysis,
  });

  const totalSpent = transactions
    .filter((tx) => ['TRANSFER', 'PAYMENT', 'WITHDRAWAL'].includes(tx.type))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const flagged = transactions.filter((tx) => tx.isFlagged);
  const recent = transactions.slice(0, 5);

  const statCards = [
    {
      label: 'Total Transactions',
      value: transactions.length,
      icon: <SwapHorizIcon />,
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      label: 'Total Spent',
      value: `$${totalSpent.toLocaleString()}`,
      icon: <TrendingUpIcon />,
      color: '#10b981',
      bg: '#f0fdf4',
    },
    {
      label: 'Flagged Transactions',
      value: flagged.length,
      icon: <WarningIcon />,
      color: '#ef4444',
      bg: '#fef2f2',
    },
  ];

  return (
    <Box>
      <Box className="flex items-center justify-between mb-6">
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b">
            Welcome back, {user?.displayName} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(), 'EEEE, MMMM d yyyy')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SmartToyIcon />}
          onClick={() => navigate('/ai')}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' },
          }}
        >
          Ask AI Assistant
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        {statCards.map((card) => (
          <Grid item xs={12} md={4} key={card.label}>
            <Card sx={{ borderRadius: 3, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Box className="flex items-center justify-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {card.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="#1e293b">
                      {txLoading ? <CircularProgress size={24} /> : card.value}
                    </Typography>
                  </Box>
                  <Box
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    sx={{ backgroundColor: card.bg, color: card.color }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} color="#1e293b" mb={2}>
                Recent Transactions
              </Typography>
              {txLoading ? (
                <Box className="flex justify-center py-8">
                  <CircularProgress />
                </Box>
              ) : recent.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No transactions yet
                </Typography>
              ) : (
                recent.map((tx) => (
                  <Box
                    key={tx.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                    sx={{ borderColor: '#f1f5f9' }}
                  >
                    <Box className="flex items-center gap-3">
                      <Box
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        sx={{
                          bgcolor: tx.isFlagged ? '#fef2f2' : '#eff6ff',
                          color: tx.isFlagged ? '#ef4444' : '#3b82f6',
                        }}
                      >
                        {tx.type[0]}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="#1e293b">
                          {tx.type}
                          {tx.isFlagged && (
                            <Chip
                              label="Flagged"
                              size="small"
                              color="error"
                              sx={{ ml: 1, height: 18, fontSize: 10 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tx.description || tx.toAccountId.slice(0, 12)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={tx.isFlagged ? '#ef4444' : '#1e293b'}
                    >
                      ${Number(tx.amount).toLocaleString()} {tx.currency}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <CardContent>
              <Box className="flex items-center gap-2 mb-3">
                <SmartToyIcon sx={{ color: '#3b82f6' }} />
                <Typography variant="h6" fontWeight={600} color="#1e293b">
                  AI Spending Analysis
                </Typography>
              </Box>
              {aiLoading ? (
                <Box className="flex flex-col items-center justify-center py-8 gap-2">
                  <CircularProgress size={32} />
                  <Typography variant="caption" color="text.secondary">
                    Analyzing your transactions...
                  </Typography>
                </Box>
              ) : analysis ? (
                <Typography
                  variant="body2"
                  color="#475569"
                  sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}
                >
                  {analysis}
                </Typography>
              ) : (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No analysis available yet
                </Typography>
              )}
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => navigate('/ai')}
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                }}
              >
                Open AI Chat
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
