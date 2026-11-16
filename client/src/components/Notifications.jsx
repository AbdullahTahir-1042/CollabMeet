import React, { useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Button, Typography } from '@mui/material';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import CallEndRoundedIcon from '@mui/icons-material/CallEndRounded';

import { SocketContext } from '../SocketContext';
import UserAvatar from './ui/UserAvatar';
import { modalPop } from '../styles/variants';
import { shadows } from '../styles/tokens';

const PulsingRings = ({ children }) => (
  <Box sx={{ position: 'relative', width: 124, height: 124, display: 'grid', placeItems: 'center', mx: 'auto' }}>
    {[0, 0.6].map((delay) => (
      <Box
        key={delay}
        component={motion.span}
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeOut' }}
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid',
          borderColor: 'primary.main',
        }}
      />
    ))}
    <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
  </Box>
);

const Notifications = () => {
  const { call, callAccepted, answerCall, declineCall } = useContext(SocketContext);
  const open = Boolean(call?.isReceivedCall) && !callAccepted && typeof answerCall === 'function';

  return (
    <AnimatePresence>
      {open ? (
        <Box
          key="incoming-call"
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 2000,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(8,10,15,0.55)',
            backdropFilter: 'blur(6px)',
            p: 2,
          }}
        >
          <Box
            component={motion.div}
            variants={modalPop}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-label="Incoming call"
            sx={{
              width: 'min(92vw, 400px)',
              bgcolor: 'background.paper',
              borderRadius: '28px',
              p: 4,
              textAlign: 'center',
              boxShadow: shadows.stage,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <PulsingRings>
              <UserAvatar name={call.name || 'Guest'} size={84} />
            </PulsingRings>
            <Typography variant="h5" sx={{ mt: 2 }}>
              {call.name || 'Someone'} is calling
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, mt: 0.5 }}>
              Incoming video call
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="error"
                startIcon={<CallEndRoundedIcon />}
                onClick={declineCall}
                sx={{ py: 1.2 }}
              >
                Decline
              </Button>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="success"
                startIcon={<CallRoundedIcon />}
                onClick={answerCall}
                sx={{ py: 1.2, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
              >
                Answer
              </Button>
            </Box>
          </Box>
        </Box>
      ) : null}
    </AnimatePresence>
  );
};

export default Notifications;
