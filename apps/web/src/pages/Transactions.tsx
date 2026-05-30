import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import { fetchTransactions, createTransaction } from '../api/transactions';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  FAILED: 'error',
  FLAGGED: 'error',
};

export const Transactions = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    fromAccountId: 'acc-001',
    toAccountId: 'acc-002',
    amount: '',
    currency: 'USD',
    type: 'TRANSFER',
    description: '',
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: (tx) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['spending-analysis'] });
      setOpen(false);
      if (tx.isFlagged) {
        toast.error(`⚠️ Transaction flagged! Risk score: ${tx.riskScore}`);
      } else {
        toast.success('Transaction created successfully');
      }
      setForm({
        fromAccountId: 'acc-001',
        toAccountId: 'acc-002',
        amount: '',
        currency: 'USD',
        type: 'TRANSFER',
        description: '',
      });
    },
    onError: () => toast.error('Transaction failed'),
  });

  const handleSubmit = () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    mutation.mutate({ ...form, amount: Number(form.amount) });
  };

  return (
    <Box>
      <Box className="flex items-center justify-between mb-6">
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b">
            Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {transactions.length} total transactions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            bgcolor: '#3b82f6',
            '&:hover': { bgcolor: '#2563eb' },
          }}
        >
          New Transaction
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                {['Type', 'Amount', 'From', 'To', 'Status', 'Risk', 'Date'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 600, color: '#64748b', fontSize: 12 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    No transactions yet — create one above
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        {tx.isFlagged && <WarningIcon sx={{ fontSize: 16, color: '#ef4444' }} />}
                        <Typography variant="body2" fontWeight={500}>
                          {tx.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={tx.isFlagged ? '#ef4444' : '#1e293b'}
                      >
                        ${Number(tx.amount).toLocaleString()} {tx.currency}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {tx.fromAccountId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {tx.toAccountId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.status}
                        size="small"
                        color={statusColors[tx.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        <Box className="h-1.5 rounded-full" sx={{ width: 40, bgcolor: '#f1f5f9' }}>
                          <Box
                            className="h-full rounded-full"
                            sx={{
                              width: `${tx.riskScore}%`,
                              bgcolor:
                                tx.riskScore > 60
                                  ? '#ef4444'
                                  : tx.riskScore > 30
                                    ? '#f59e0b'
                                    : '#10b981',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {tx.riskScore}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(tx.createdAt), 'MMM d, HH:mm')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={600}>New Transaction</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box className="flex flex-col gap-3 mt-1">
            <TextField
              label="From Account"
              value={form.fromAccountId}
              onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="To Account"
              value={form.toAccountId}
              onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
              fullWidth
              size="small"
            />
            <Box className="flex gap-3">
              <TextField
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                select
                label="Currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                size="small"
                sx={{ minWidth: 100 }}
              >
                {['USD', 'EUR', 'GBP', 'AED'].map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              fullWidth
              size="small"
            >
              {['TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'PAYMENT'].map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
            }}
          >
            {mutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Create Transaction'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
