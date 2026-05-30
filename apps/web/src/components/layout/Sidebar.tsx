import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  Avatar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useAuthStore } from '../../store/auth.store';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Transactions', path: '/transactions', icon: <SwapHorizIcon /> },
  { label: 'AI Assistant', path: '/ai', icon: <SmartToyIcon /> },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          color: 'white',
        },
      }}
    >
      <Toolbar>
        <AccountBalanceIcon sx={{ mr: 1, color: '#60a5fa' }} />
        <Typography variant="h6" fontWeight={700} color="#60a5fa">
          FinFlow AI
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: '#334155' }} />

      <Box className="flex flex-col h-full">
        <List sx={{ flex: 1, pt: 2 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    backgroundColor: active ? '#3b82f6' : 'transparent',
                    '&:hover': { backgroundColor: active ? '#2563eb' : '#334155' },
                  }}
                >
                  <ListItemIcon sx={{ color: active ? 'white' : '#94a3b8', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? 'white' : '#94a3b8',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor: '#334155' }} />
        <Box className="p-4">
          <Box className="flex items-center gap-3 mb-3">
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#3b82f6', fontSize: 14 }}>
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600} color="white" noWrap>
                {user?.displayName || 'User'}
              </Typography>
              <Typography variant="caption" color="#94a3b8" noWrap>
                {user?.role?.replace('_', ' ') || 'Customer'}
              </Typography>
            </Box>
          </Box>
          <ListItemButton
            onClick={logout}
            sx={{ borderRadius: 2, '&:hover': { backgroundColor: '#334155' } }}
          >
            <ListItemIcon sx={{ color: '#94a3b8', minWidth: 40 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: 14, color: '#94a3b8' }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
};
