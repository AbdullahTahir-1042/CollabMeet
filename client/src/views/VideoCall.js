import React, { useContext, useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import CallEndRoundedIcon from '@mui/icons-material/CallEndRounded';
import { useSnackbar } from 'notistack';

import CallSettings from '../components/CallSettings';
import CallDrawer from '../components/CallDrawer';
import BrandLogo from '../components/ui/BrandLogo';

import { SocketContext } from '../SocketContext';
import { getMeeting } from '../api/index';
import { radii, shadows } from '../styles/tokens';

const NamePill = ({ children }) => (
  <Box sx={{ position: 'absolute', left: 10, bottom: 10, px: 1, py: 0.25, borderRadius: 999, bgcolor: 'rgba(8,10,15,0.62)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: 12, fontWeight: 600, maxWidth: 'calc(100% - 20px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
    {children}
  </Box>
);

const RemoteTile = ({ peer }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && peer.stream) ref.current.srcObject = peer.stream;
  }, [peer.stream]);
  return (
    <Box sx={{ position: 'relative', minHeight: 0, minWidth: 0, bgcolor: '#171A21', borderRadius: `${radii.lg}px`, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <video ref={ref} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#0F1115' }} />
      <NamePill>{peer.name || 'Guest'}</NamePill>
    </Box>
  );
};

const VideoCall = () => {
  const { id } = useParams();
  const code = (id || '').toString();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const stageRef = useRef(null);

  const { name, callStarted, callJoined, callFull, joinBlocked, startCall, myVideo, callEnded, stream, peers, participants } = useContext(SocketContext);

  const [meetingName, setMeetingName] = useState('');
  const [meetingMeta, setMeetingMeta] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getMeeting(code);
        if (active) {
          setMeetingName(data?.title || 'Meeting');
          setMeetingMeta(data || null);
        }
      } catch (e) {
        if (active) setMeetingName('Meeting');
      }
    })();
    return () => { active = false; };
  }, [code]);

  useEffect(() => {
    if (!stream) return;
    if (sessionStorage.getItem('collabmeet:autoJoin') === '1') {
      sessionStorage.removeItem('collabmeet:autoJoin');
      const t = setTimeout(() => startCall(), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [stream, startCall]);

  const inCall = callStarted || callJoined;
  const hasRemotes = peers.length > 0;
  const count = Math.max(participants?.length || 1, 1);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      enqueueSnackbar('Meeting link copied', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar('Could not copy link', { variant: 'error' });
    }
  };

  const gridCols = peers.length <= 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))';

  return (
    <Box ref={stageRef} sx={{ position: 'relative', height: '100vh', '@supports (height: 100dvh)': { height: '100dvh' }, width: '100%', overflow: 'hidden', bgcolor: '#0F1115', color: '#F3F4F6' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(1200px 700px at 15% 0%, rgba(47,99,176,0.34), transparent 60%), radial-gradient(900px 600px at 90% 100%, rgba(16,185,129,0.14), transparent 60%)' }} />

      {inCall && hasRemotes ? (
        <Box sx={{ position: 'absolute', inset: 0, p: { xs: 1, md: 1.5 }, pt: { xs: 8, md: 9 }, pb: { xs: 11, md: 13 }, display: 'grid', gridTemplateColumns: gridCols, gap: 1, zIndex: 1 }}>
          {peers.map((peer) => <RemoteTile key={peer.socketId} peer={peer} />)}
        </Box>
      ) : null}

      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 }, background: 'linear-gradient(to bottom, rgba(8,10,15,0.72), transparent)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <BrandLogo height={22} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, color: '#fff' }}>{meetingName || 'Meeting'}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.62)' }}>Up to 4 people · sign in required</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip icon={<GroupsRoundedIcon sx={{ color: 'rgba(255,255,255,0.75) !important' }} />} label={`${count}/4`} size="small" sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)' }} />
          <Tooltip title="Copy meeting link"><IconButton onClick={copyLink} aria-label="Copy meeting link" sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' } }}><LinkRoundedIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      </Box>

      {callFull ? (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, zIndex: 900 }}>
          <Box component={motion.div} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} sx={{ width: 'min(92vw, 420px)', textAlign: 'center', p: 4, borderRadius: `${radii.xl}px`, bgcolor: 'rgba(23,26,33,0.94)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: shadows.stage }}>
            <CallEndRoundedIcon sx={{ fontSize: 40, color: 'error.light' }} />
            <Typography variant="h5" sx={{ mt: 1 }}>This meeting is full</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)', mt: 1, mb: 3 }}>This meeting already has 4 people. Please try again later.</Typography>
            <Button variant="contained" onClick={() => history.push('/meetings')}>Back to meetings</Button>
          </Box>
        </Box>
      ) : joinBlocked ? (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, zIndex: 900 }}>
          <Box component={motion.div} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} sx={{ width: 'min(92vw, 420px)', textAlign: 'center', p: 4, borderRadius: `${radii.xl}px`, bgcolor: 'rgba(23,26,33,0.94)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: shadows.stage }}>
            <Typography variant="h5">Meeting not available</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)', mt: 1, mb: 3 }}>{joinBlocked}{meetingMeta?.startsAt ? ` It starts ${new Date(meetingMeta.startsAt).toLocaleString()}.` : ''}</Typography>
            <Button variant="contained" onClick={() => history.push('/meetings')}>Back to meetings</Button>
          </Box>
        </Box>
      ) : callEnded ? (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, zIndex: 900 }}>
          <Box component={motion.div} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} sx={{ width: 'min(92vw, 420px)', textAlign: 'center', p: 4, borderRadius: `${radii.xl}px`, bgcolor: 'rgba(23,26,33,0.94)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: shadows.stage }}>
            <Typography variant="h5">You left the meeting</Typography>
            <Button variant="contained" onClick={() => history.push('/meetings')} sx={{ mt: 2 }}>Back to meetings</Button>
          </Box>
        </Box>
      ) : !inCall ? (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, zIndex: 900 }}>
          <Box component={motion.div} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }} sx={{ width: 'min(92vw, 440px)', textAlign: 'center', p: { xs: 3, md: 4 }, borderRadius: `${radii.xl}px`, bgcolor: 'rgba(23,26,33,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: shadows.stage }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}><BrandLogo height={30} /></Box>
            <Typography variant="h4" sx={{ color: '#fff' }}>{meetingName || 'Meeting'}</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)', mt: 1, mb: 3 }}>Anyone with this link can join (up to 4 people) after signing in. In-meeting chat stays in the meeting.</Typography>
            <Button fullWidth size="large" variant="contained" startIcon={<PhoneRoundedIcon />} onClick={startCall} disabled={!stream || (meetingMeta?.type === 'scheduled' && meetingMeta?.startsAt && Date.now() < new Date(meetingMeta.startsAt).getTime())} sx={{ py: 1.35, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}>Join now</Button>
            {meetingMeta?.type === 'scheduled' && meetingMeta?.startsAt && Date.now() < new Date(meetingMeta.startsAt).getTime() ? <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: 'rgba(255,255,255,0.7)' }}>Starts {new Date(meetingMeta.startsAt).toLocaleString()}.</Typography> : null}
            <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: 'rgba(255,255,255,0.6)' }}>
              {stream ? 'Your mic and camera will be off when you join.' : 'Allow camera and microphone access to join.'}
            </Typography>
            <Button fullWidth variant="text" onClick={copyLink} sx={{ mt: 1, color: 'rgba(255,255,255,0.72)' }}>Copy meeting link</Button>
          </Box>
        </Box>
      ) : null}

      <Box component={motion.div} drag dragConstraints={stageRef} dragElastic={0.08} dragMomentum={false} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} whileDrag={{ scale: 1.02 }} sx={{ position: 'absolute', right: { xs: 12, md: 24 }, bottom: { xs: 78, md: 112 }, width: inCall ? { xs: 112, md: 220 } : { xs: 140, md: 260 }, aspectRatio: '16 / 10', borderRadius: `${radii.lg}px`, overflow: 'hidden', bgcolor: '#000', border: '1px solid rgba(255,255,255,0.18)', boxShadow: shadows.stage, cursor: 'grab', zIndex: 1000, touchAction: 'none' }}>
        <video ref={myVideo} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <NamePill>{name || 'You'}</NamePill>
      </Box>

      <CallSettings />
      <CallDrawer />
    </Box>
  );
};

export default VideoCall;
