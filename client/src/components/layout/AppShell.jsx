import React from 'react';
import { motion } from 'framer-motion';
import { Badge, Box, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import VideoCallRoundedIcon from '@mui/icons-material/VideoCallRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Sidebar from './Sidebar';
import UserMenu from './UserMenu';
import { useThemeMode } from '../../context/ThemeModeContext';
import { shadows } from '../../styles/tokens';

const MobileNav = () => {
  const { mode, toggleMode } = useThemeMode();
  const history = useHistory();
  const location = useLocation();
  const requests = useSelector((s) => s.dms?.requests || []);

  const item = (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', color: active ? 'primary.main' : 'text.secondary', cursor: 'pointer' });

  return (
    <Box
      component={motion.nav}
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, zIndex: 1200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around', px: 2,
        bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', boxShadow: shadows.md,
      }}
    >
      <Box sx={item(location.pathname === '/' || location.pathname === '/chats')} onClick={() => history.push('/')}>
        <Badge color="error" badgeContent={requests.length || 0} invisible={!requests.length}>
          <ChatBubbleRoundedIcon fontSize="small" />
        </Badge>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>Chats</Typography>
      </Box>

      <Box sx={item(location.pathname === '/meetings')} onClick={() => history.push('/meetings')}>
        <VideoCallRoundedIcon fontSize="small" />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>Meetings</Typography>
      </Box>

      <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
        <IconButton onClick={toggleMode} aria-label="Toggle color theme" color="inherit">
          {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
        </IconButton>
      </Tooltip>

      <UserMenu size={34} />
    </Box>
  );
};

const AppShell = ({ children }) => {
  const isDesktop = useMediaQuery('(min-width:900px)');

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {isDesktop ? <Sidebar /> : null}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          pb: isDesktop ? 0 : '60px',
        }}
      >
        {children}
      </Box>

      {!isDesktop ? <MobileNav /> : null}
    </Box>
  );
};

export default AppShell;
