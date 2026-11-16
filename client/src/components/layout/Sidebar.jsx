import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Box, IconButton, Tooltip, Typography } from '@mui/material';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import VideoCallRoundedIcon from '@mui/icons-material/VideoCallRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useSelector } from 'react-redux';

import UserMenu from './UserMenu';
import BrandLogo from '../ui/BrandLogo';
import { useThemeMode } from '../../context/ThemeModeContext';
import { radii } from '../../styles/tokens';

const COLLAPSED = 78;
const EXPANDED = 232;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const history = useHistory();
  const { mode, toggleMode } = useThemeMode();
  const requests = useSelector((s) => s.dms?.requests || []);

  const isChats = location.pathname === '/' || location.pathname === '/chats';
  const isMeetings = location.pathname === '/meetings';

  const NavItem = ({ active, label, icon: Icon, onClick, badge }) => (
    <Tooltip title={collapsed ? label : ''} placement="right">
      <Box
        component={motion.button}
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.96 }}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        sx={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: collapsed ? 0 : 1.5,
          py: 1.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: `${radii.md}px`,
          color: active ? 'primary.main' : 'text.secondary',
          fontFamily: 'inherit',
          fontWeight: 600,
          fontSize: 14,
          '&:hover': { color: 'text.primary' },
        }}
      >
        {active ? (
          <Box
            component={motion.span}
            layout
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: `${radii.md}px`,
              bgcolor: 'primary.main',
              opacity: 0.12,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        ) : null}
        <Badge color="error" badgeContent={badge || 0} invisible={!badge || !collapsed} sx={{ position: 'relative', zIndex: 1 }}>
          <Icon sx={{ fontSize: 24 }} />
        </Badge>
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <Box
              component={motion.span}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              sx={{ position: 'relative', zIndex: 1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {label}
              {badge ? <Badge color="error" badgeContent={badge} /> : null}
            </Box>
          ) : null}
        </AnimatePresence>
      </Box>
    </Tooltip>
  );

  return (
    <Box
      component={motion.aside}
      animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        px: 1.5,
        py: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 0 : 1,
          height: 44,
        }}
      >
        <BrandLogo height={collapsed ? 40 : 24} mark={collapsed} />
      </Box>

      <Box sx={{ mt: 2 }}>
        <NavItem active={isChats} label="Chats" icon={ChatBubbleRoundedIcon} onClick={() => history.push('/')} badge={requests.length} />
        <NavItem active={isMeetings} label="Meetings" icon={VideoCallRoundedIcon} onClick={() => history.push('/meetings')} />
      </Box>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'} placement="right">
          <IconButton
            onClick={toggleMode}
            aria-label="Toggle color theme"
            sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 1.5, borderRadius: `${radii.md}px`, gap: 1.5, width: '100%', color: 'text.secondary' }}
          >
            {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            {!collapsed ? <Typography variant="body2" sx={{ fontWeight: 600 }}>Theme</Typography> : null}
          </IconButton>
        </Tooltip>

        <Tooltip title={collapsed ? 'Expand menu' : 'Collapse menu'} placement="right">
          <IconButton
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 1.5, borderRadius: `${radii.md}px`, gap: 1.5, width: '100%', color: 'text.secondary' }}
          >
            {collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
            {!collapsed ? <Typography variant="body2" sx={{ fontWeight: 600 }}>Collapse</Typography> : null}
          </IconButton>
        </Tooltip>

        <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 0.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <UserMenu size={38} />
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
