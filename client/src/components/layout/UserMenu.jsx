import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

import UserAvatar from '../ui/UserAvatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useThemeMode } from '../../context/ThemeModeContext';

const UserMenu = ({ size = 38 }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();
  const { mode, toggleMode } = useThemeMode();

  const user = JSON.parse(localStorage.getItem('profile'));
  const name = user?.result?.name || 'Guest';
  const email = user?.result?.email || '';

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setConfirmOpen(false);
    setAnchorEl(null);
    history.replace('/auth');
    window.setTimeout(() => {
      if (!window.location.hash.includes('/auth')) {
        window.location.hash = '#/auth';
      }
    }, 0);
  };

  return (
    <>
      <Tooltip title="Account">
        <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} sx={{ p: 0.5 }}>
          <UserAvatar name={name} size={size} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionProps={{ timeout: 180 }}
        PaperProps={{ sx: { width: 260, p: 1 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1 }}>
          <UserAvatar name={name} size={42} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <PersonRoundedIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>

        <MenuItem onClick={toggleMode} sx={{ pr: 1 }}>
          <ListItemIcon>
            {mode === 'dark' ? (
              <LightModeRoundedIcon fontSize="small" />
            ) : (
              <DarkModeRoundedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <Box sx={{ flex: 1 }}>Dark mode</Box>
          <Switch
            size="small"
            checked={mode === 'dark'}
            onChange={toggleMode}
            onClick={(event) => event.stopPropagation()}
            inputProps={{ 'aria-label': 'Toggle dark mode' }}
          />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={() => setConfirmOpen(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={confirmOpen}
        title="Log out of CollabMeet?"
        description="You will need to sign in again to access your chats and meetings."
        confirmLabel="Log out"
        danger
        onConfirm={handleLogout}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default UserMenu;
