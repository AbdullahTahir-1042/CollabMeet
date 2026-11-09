import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';

import UserAvatar from './ui/UserAvatar';
import { clockTime, dayLabel } from '../utils/format';
import { bubblePop } from '../styles/variants';
import { shadows } from '../styles/tokens';

const Message = ({ msg, own, showHeader, showDay }) => {
  if (!msg?.senderId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
        <Box
          sx={{
            px: 1.75,
            py: 0.5,
            borderRadius: 999,
            bgcolor: 'action.hover',
            color: 'text.secondary',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {msg?.text}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {showDay ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2.5 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {dayLabel(msg.createdAt)}
          </Typography>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: own ? 'flex-end' : 'flex-start',
          mt: showHeader ? 1.5 : 0.5,
        }}
      >
        {showHeader && !own && msg.senderName ? (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 5.5, mb: 0.5, fontWeight: 500 }}>
            {msg.senderName}
          </Typography>
        ) : null}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            flexDirection: own ? 'row-reverse' : 'row',
            width: '100%',
          }}
        >
          <Box sx={{ width: 36, flexShrink: 0 }}>
            {showHeader && !own ? <UserAvatar name={msg.senderName || '?'} size={36} /> : null}
          </Box>

          <Box
            component={motion.div}
            variants={bubblePop}
            initial="hidden"
            animate="visible"
            sx={{
              px: 1.75,
              py: 1,
              width: 'fit-content',
              minWidth: '4.75rem',
              maxWidth: { xs: '85%', sm: '60%', md: '40%' },
              borderRadius: own ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              bgcolor: own ? 'primary.main' : 'background.paper',
              color: own ? 'primary.contrastText' : 'text.primary',
              border: own ? 'none' : '1px solid',
              borderColor: 'divider',
              boxShadow: own ? shadows.glow : shadows.sm,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              opacity: msg.pending ? 0.65 : 1,
            }}
          >
            <Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>{msg.text}</Typography>
            <Typography
              component="span"
              sx={{
                display: 'block',
                mt: 0.25,
                fontSize: 10.5,
                textAlign: own ? 'right' : 'left',
                whiteSpace: 'nowrap',
                color: own ? 'rgba(255,255,255,0.72)' : 'text.secondary',
              }}
            >
              {clockTime(msg.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Message;
