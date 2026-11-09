import React, { useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, IconButton, Tooltip } from '@mui/material';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import ScreenShareRoundedIcon from '@mui/icons-material/ScreenShareRounded';
import StopScreenShareRoundedIcon from '@mui/icons-material/StopScreenShareRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import PanToolOutlinedIcon from '@mui/icons-material/PanToolOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CallEndRoundedIcon from '@mui/icons-material/CallEndRounded';
import { useSnackbar } from 'notistack';

import { SocketContext } from '../SocketContext';
import ConfirmDialog from './ui/ConfirmDialog';
import { dockUp } from '../styles/variants';
import { shadows } from '../styles/tokens';

const DockButton = ({ title, active, danger, disabled, onClick, children }) => (
  <Tooltip title={title}>
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        aria-label={title}
        sx={{
          width: { xs: 44, md: 48 },
          height: { xs: 44, md: 48 },
          color: '#fff',
          bgcolor: danger
            ? 'error.main'
            : active
              ? 'rgba(91,143,214,0.4)'
              : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          '&:hover': {
            bgcolor: danger ? 'error.dark' : 'rgba(255,255,255,0.18)',
          },
          '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', borderColor: 'transparent' },
        }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

const ToggleIcon = ({ on, onIcon: OnIcon, offIcon: OffIcon }) => (
  <AnimatePresence initial={false} exitBeforeEnter>
    <motion.span
      key={on ? 'on' : 'off'}
      initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.6, rotate: 20 }}
      transition={{ duration: 0.14 }}
      style={{ display: 'inline-flex' }}
    >
      {on ? <OnIcon /> : <OffIcon />}
    </motion.span>
  </AnimatePresence>
);

const CallSettings = () => {
  const {
    callStarted,
    stream,
    leaveCall,
    myVideo,
    videoStream,
    peersRef,
    micOn,
    setMicOn,
    cameraOn,
    setCameraOn,
    chatVisibility,
    setChatVisibility,
    participantsVisible,
    setParticipantsVisible,
    handleHand,
    handRaised,
    setHandRaised,
  } = useContext(SocketContext);

  const { enqueueSnackbar } = useSnackbar();
  const [shareScreen, setShareScreen] = useState(false);
  const [shareStream, setShareStream] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setTracks = (kind, enabled) => {
    if (!stream) return;
    stream.getTracks().filter((track) => track.kind === kind).forEach((track) => {
      track.enabled = enabled;
    });
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    setCameraOn(next);
    setTracks('video', next);
  };

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    setTracks('audio', next);
  };

  const shareUserScreen = () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      enqueueSnackbar('Screen sharing is not supported in this browser', { variant: 'warning' });
      return;
    }

    navigator.mediaDevices
      .getDisplayMedia({ video: true, cursor: true })
      .then((currentStream) => {
        setShareStream(currentStream);

        const videoTrack = currentStream.getTracks()[0]; if (stream?.getTracks()[1]) stream.getTracks()[1] = videoTrack; if (peersRef?.current) { Object.values(peersRef.current).forEach((p) => { const sender = p?._pc?.getSenders?.()?.find((s) => s.track && s.track.kind === 'video'); if (sender && videoTrack) sender.replaceTrack(videoTrack).catch(() => {}); }); }

        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        setShareScreen(true);

        currentStream.getTracks()[0].onended = () => {
          stopSharingScreen(currentStream);
        };
      })
      .catch(() => {
        enqueueSnackbar('Screen share was cancelled', { variant: 'info' });
      });
  };

  const stopSharingScreen = (streamToStop = shareStream) => {
    const cam = videoStream?.getTracks()?.find((t) => t.kind === 'video'); if (cam && peersRef?.current) { Object.values(peersRef.current).forEach((p) => { const sender = p?._pc?.getSenders?.()?.find((s) => s.track && s.track.kind === 'video'); if (sender) sender.replaceTrack(cam).catch(() => {}); }); }

    if (myVideo.current) {
      myVideo.current.srcObject = videoStream;
    }

    if (streamToStop) {
      streamToStop.getTracks().forEach((track) => track.stop());
    }

    setShareScreen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      enqueueSnackbar('Meeting link copied', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Could not copy link', { variant: 'error' });
    }
  };

  const toggleChat = () => {
    setChatVisibility(!chatVisibility);
    setParticipantsVisible(false);
  };

  const togglePeople = () => {
    setParticipantsVisible(!participantsVisible);
    setChatVisibility(false);
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    handleHand(next);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: { xs: 14, md: 24 },
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1100,
        px: 1,
        pointerEvents: 'none',
      }}
    >
      <Box
        component={motion.div}
        variants={dockUp}
        initial="hidden"
        animate="visible"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, md: 0.75 },
          p: 1,
          borderRadius: 999,
          bgcolor: 'rgba(18,20,28,0.66)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: shadows.stage,
          pointerEvents: 'auto',
          maxWidth: '100%',
          overflowX: 'auto',
        }}
      >
        <DockButton
          title={micOn ? 'Mute microphone' : 'Unmute microphone'}
          active={!micOn}
          disabled={!stream}
          onClick={toggleMic}
        >
          <ToggleIcon on={micOn} onIcon={MicRoundedIcon} offIcon={MicOffRoundedIcon} />
        </DockButton>

        <DockButton
          title={cameraOn ? 'Turn camera off' : 'Turn camera on'}
          active={!cameraOn}
          disabled={!stream}
          onClick={toggleCamera}
        >
          <ToggleIcon on={cameraOn} onIcon={VideocamRoundedIcon} offIcon={VideocamOffRoundedIcon} />
        </DockButton>

        {callStarted ? (
          <>
            <DockButton
              title={shareScreen ? 'Stop sharing' : 'Share your screen'}
              active={shareScreen}
              onClick={() => (shareScreen ? stopSharingScreen() : shareUserScreen())}
            >
              <ToggleIcon
                on={!shareScreen}
                onIcon={ScreenShareRoundedIcon}
                offIcon={StopScreenShareRoundedIcon}
              />
            </DockButton>

            <DockButton title={handRaised ? 'Lower hand' : 'Raise hand'} active={handRaised} onClick={toggleHand}>
              <ToggleIcon on={!handRaised} onIcon={PanToolOutlinedIcon} offIcon={PanToolRoundedIcon} />
            </DockButton>

            <DockButton title="Copy meeting link" onClick={copyLink}>
              <LinkRoundedIcon />
            </DockButton>

            <DockButton title="Chat" active={chatVisibility} onClick={toggleChat}>
              <ChatBubbleOutlineRoundedIcon />
            </DockButton>

            <DockButton title="Participants" active={participantsVisible} onClick={togglePeople}>
              <GroupRoundedIcon />
            </DockButton>

            <DockButton title="Leave call" danger onClick={() => setConfirmOpen(true)}>
              <CallEndRoundedIcon />
            </DockButton>
          </>
        ) : null}
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Leave this call?"
        description="The call will end for you and your media will stop."
        confirmLabel="Leave call"
        cancelLabel="Stay"
        danger
        onConfirm={leaveCall}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
};

export default CallSettings;
