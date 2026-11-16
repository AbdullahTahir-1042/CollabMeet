import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';

import UserAvatar from './ui/UserAvatar';
import { relativeTime } from '../utils/format';
import { staggerItem } from '../styles/variants';

const Conversation = ({ conversation, active, onClick }) => {
  const name = conversation?.conversationName || 'New Meeting';
  const preview = conversation?.lastMessage || 'No messages yet';
  const timestamp = conversation?.lastMessageAt || conversation?.createdAt;

  return (
    <Box
      component={motion.button}
      type="button"
      onClick={onClick}
      variants={staggerItem}
      whileTap={{ scale: 0.99 }}
      aria-current={active ? 'true' : undefined}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        textAlign: 'left',
        border: 'none',
        fontFamily: 'inherit',
        cursor: 'pointer',
        p: 1.25,
        borderRadius: 2,
        bgcolor: active ? 'action.selected' : 'transparent',
        transition: 'background-color 160ms ease',
        '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' },
      }}
    >
      {active ? (
        <Box
          component={motion.span}
          layout
          sx={{
            position: 'absolute',
            left: 0,
            top: 12,
            bottom: 12,
            width: 3,
            borderRadius: 999,
            bgcolor: 'primary.main',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      ) : null}

      <UserAvatar name={name} size={46} />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, flex: 1 }}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {relativeTime(timestamp)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
          {preview}
        </Typography>
      </Box>
    </Box>
  );
};

export default Conversation;
