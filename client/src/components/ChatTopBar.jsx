import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { useSnackbar } from 'notistack';

import UserAvatar from './ui/UserAvatar';
import { shadows } from '../styles/tokens';

const buildMeetingLink = (chatId) => `${window.location.href.split('#')[0]}#/meeting/${chatId}`;

const ChatTopBar = ({ convoName = '', chatId, showBack = false, onBack }) => {
  const { enqueueSnackbar } = useSnackbar();

  const joinCall = () => {
    if (!chatId) return;
    window.open(buildMeetingLink(chatId), '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildMeetingLink(chatId));
      enqueueSnackbar('Meeting link copied', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Could not copy link', { variant: 'error' });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: { xs: 1.25, md: 2.5 },
        py: 1.25,
        minHeight: 68,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: shadows.sm,
        zIndex: 2,
      }}
    >
      {showBack ? (
        <IconButton onClick={onBack} aria-label="Back to chats">
          <ArrowBackRoundedIcon />
        </IconButton>
      ) : null}

      <UserAvatar name={convoName || 'Conversation'} size={40} />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
          {convoName || 'Conversation'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography variant="caption" color="text.secondary">
          Direct message
        </Typography>
      </Box>
      </Box>

      {chatId ? (
        <>
          <Tooltip title="Copy meeting link">
            <IconButton onClick={copyLink} aria-label="Copy meeting link">
              <ContentCopyRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Join video call">
            <IconButton onClick={joinCall} aria-label="Join video call" sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}>
              <VideocamRoundedIcon />
            </IconButton>
          </Tooltip>
        </>
      ) : null}
    </Box>
  );
};

export default ChatTopBar;
