import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout = () => (
  <Box className="flex min-h-screen">
    <Sidebar />
    <Box component="main" className="flex-1 p-6 bg-gray-50 min-h-screen">
      <Outlet />
    </Box>
  </Box>
);
