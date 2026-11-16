import React from 'react';
import { Box, IconButton, InputBase, Tooltip } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import { radii, shadows } from '../styles/tokens';

const ChatComposer = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const canSend = Boolean(value.trim()) && !disabled;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <Box sx={{ p: { xs: 1.25, md: 2 }, pt: 1.25, bgcolor: 'background.default' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          py: 0.5,
          pl: 2,
          pr: 0.5,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: `${radii.pill}px`,
          boxShadow: shadows.sm,
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
          '&:focus-within': { borderColor: 'primary.main', boxShadow: shadows.glow },
        }}
      >
        <InputBase
          multiline
          maxRows={4}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          inputProps={{ 'aria-label': 'Message input' }}
          sx={{ flex: 1, py: 1.1, fontSize: 14 }}
        />
        <Tooltip title="Send message">
          <span>
            <IconButton
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send message"
              sx={{
                width: 42,
                height: 42,
                bgcolor: canSend ? 'primary.main' : 'action.hover',
                color: canSend ? '#fff' : 'text.secondary',
                '&:hover': { bgcolor: canSend ? 'primary.dark' : 'action.selected' },
                '&.Mui-disabled': { bgcolor: 'action.hover', color: 'text.disabled' },
              }}
            >
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ChatComposer;
