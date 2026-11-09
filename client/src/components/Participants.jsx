import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Box, Chip, Stack, Typography } from '@mui/material';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';

import { SocketContext } from '../SocketContext';
import UserAvatar from './ui/UserAvatar';
import EmptyState from './ui/EmptyState';
import { staggerContainer, staggerItem } from '../styles/variants';

const Participants = () => {
  const { participants } = useContext(SocketContext);
  const people = participants || [];

  if (!people.length) {
    return (
      <EmptyState
        icon={GroupRoundedIcon}
        title="No one else here yet"
        description="Share the meeting link to invite teammates to the call."
        sx={{ py: 6 }}
      />
    );
  }

  return (
    <Stack component={motion.div} variants={staggerContainer} initial="hidden" animate="visible" spacing={0.5} sx={{ p: 1.5 }}>
      {people.map((participant, index) => (
        <Box
          key={`${participant.name}-${index}`}
          component={motion.div}
          variants={staggerItem}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            borderRadius: 2,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <UserAvatar name={participant.name || 'Guest'} size={38} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {participant.name || 'Guest'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {participant.handRaised ? 'Hand raised' : 'In the meeting'}
            </Typography>
          </Box>
          {participant.handRaised ? (
            <Chip
              size="small"
              icon={<PanToolRoundedIcon sx={{ fontSize: '14px !important' }} />}
              label="Hand"
              color="warning"
              variant="outlined"
            />
          ) : null}
        </Box>
      ))}
    </Stack>
  );
};

export default Participants;
