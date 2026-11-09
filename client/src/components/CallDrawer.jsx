import React, { useContext, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, IconButton, Tab, Tabs } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';

import { SocketContext } from '../SocketContext';
import MeetingChat from './MeetingChat';
import Participants from './Participants';
import { drawerRight } from '../styles/variants';
import { shadows } from '../styles/tokens';

const CallDrawer = () => {
  const {
    chatVisibility,
    setChatVisibility,
    participantsVisible,
    setParticipantsVisible,
  } = useContext(SocketContext);

  const open = chatVisibility || participantsVisible;
  const tab = chatVisibility ? 'chat' : 'people';

  const close = () => {
    setChatVisibility(false);
    setParticipantsVisible(false);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setChatVisibility(false);
        setParticipantsVisible(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setChatVisibility, setParticipantsVisible]);

  const handleTab = (value) => {
    if (value === 'chat') {
      setChatVisibility(true);
      setParticipantsVisible(false);
    } else {
      setParticipantsVisible(true);
      setChatVisibility(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <Box
          key="call-drawer-overlay"
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={close}
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.35)',
            zIndex: 1200,
          }}
        />
      ) : null}

      {open ? (
        <Box
          key="call-drawer"
          component={motion.aside}
          variants={drawerRight}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-label={tab === 'chat' ? 'Meeting chat' : 'Meeting participants'}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: { xs: '100%', sm: 400 },
            maxWidth: '100%',
            bgcolor: 'background.paper',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: 1,
            borderColor: 'divider',
            boxShadow: shadows.stage,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1, pt: 1 }}>
            <Tabs value={tab} onChange={(event, value) => handleTab(value)} sx={{ flex: 1, minHeight: 48 }}>
              <Tab
                value="chat"
                label="Chat"
                icon={<ChatBubbleOutlineRoundedIcon fontSize="small" />}
                iconPosition="start"
              />
              <Tab
                value="people"
                label="People"
                icon={<GroupRoundedIcon fontSize="small" />}
                iconPosition="start"
              />
            </Tabs>
            <IconButton onClick={close} aria-label="Close panel">
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {tab === 'chat' ? (
              <MeetingChat />
            ) : (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Participants />
              </Box>
            )}
          </Box>
        </Box>
      ) : null}
    </AnimatePresence>
  );
};

export default CallDrawer;
