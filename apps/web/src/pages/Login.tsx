import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useAuthStore } from '../store/auth.store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Login = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleTokenLogin = async () => {
    if (!token.trim()) {
      setError('Please enter a JWT token');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');
      const payload = JSON.parse(atob(parts[1]));
      const user = {
        id: payload.sub,
        email: payload.email,
        displayName: payload.email?.split('@')[0] || 'User',
        role: payload.role,
        tenantId: payload.tenantId,
      };
      setAuth(user, token.trim());
      toast.success(`Welcome, ${user.displayName}!`);
      navigate('/dashboard');
    } catch {
      setError('Invalid JWT token. Generate one with the test script.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
      <Card sx={{ width: 420, borderRadius: 3, boxShadow: 24 }}>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex flex-col items-center mb-6">
            <Box className="flex items-center gap-2 mb-2">
              <AccountBalanceIcon sx={{ fontSize: 40, color: '#3b82f6' }} />
              <Typography variant="h4" fontWeight={700} color="#1e293b">
                FinFlow AI
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Banking & Retail Intelligence Platform
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle2" fontWeight={600} mb={1} color="#1e293b">
            Enter JWT Token
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Paste your JWT token here..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mb: 2, fontFamily: 'monospace' }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleTokenLogin}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#3b82f6',
              '&:hover': { bgcolor: '#2563eb' },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Dev mode
            </Typography>
          </Divider>

          <Box className="bg-slate-50 rounded-lg p-3">
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Generate a test token:
            </Typography>
            <Typography
              variant="caption"
              fontFamily="monospace"
              color="#1e293b"
              display="block"
              sx={{ wordBreak: 'break-all' }}
            >
              node scripts/generate-test-token.js
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
