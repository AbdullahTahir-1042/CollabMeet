import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import VideoCallRoundedIcon from '@mui/icons-material/VideoCallRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import { useSnackbar } from 'notistack';

import EmptyState from '../components/ui/EmptyState';
import { fetchMeetings, createInstant, createScheduled } from '../actions/meetings';
import { radii, shadows } from '../styles/tokens';

const fmt = (d) => (d ? new Date(d).toLocaleString() : '');

const Meetings = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const meetings = useSelector((s) => s.meetings?.items || []);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('instant');
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { dispatch(fetchMeetings()); }, [dispatch]);

  const toLocalInput = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    if (open && mode === 'scheduled' && !startsAt) {
      const d = new Date(Date.now() + 30 * 60 * 1000);
      setStartsAt(toLocalInput(d));
    }
  }, [open, mode, startsAt]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      if (mode === 'instant') {
        const data = await dispatch(createInstant({ title: title.trim() || 'Instant meeting' }));
        if (data?.code) {
          setOpen(false); setTitle('');
          enqueueSnackbar('Meeting created', { variant: 'success' });
          history.push(`/meeting/${data.code}`);
        } else {
          enqueueSnackbar('Could not create meeting', { variant: 'error' });
        }
      } else {
        if (!startsAt) { enqueueSnackbar('Choose a start time', { variant: 'warning' }); return; }
        const data = await dispatch(createScheduled({ title: title.trim() || 'Scheduled meeting', startsAt: new Date(startsAt).toISOString() }));
        if (data?.code) {
          setOpen(false); setTitle(''); setStartsAt('');
          enqueueSnackbar('Meeting scheduled', { variant: 'success' });
          dispatch(fetchMeetings());
        } else {
          enqueueSnackbar(data?.message || 'Could not schedule meeting', { variant: 'error' });
        }
      }
    } finally { setCreating(false); }
  };

  const copyLink = async (code) => {
    const url = `${window.location.href.split('#')[0]}#/meeting/${code}`;
    try { await navigator.clipboard.writeText(url); enqueueSnackbar('Meeting link copied', { variant: 'success' }); }
    catch (e) { enqueueSnackbar('Could not copy link', { variant: 'error' }); }
  };

  const canJoin = (m) => {
    if (m.status === 'ended' || m.status === 'cancelled') return false;
    if (m.type === 'instant') return true;
    return m.startsAt ? Date.now() >= new Date(m.startsAt).getTime() : true;
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4">Meetings</Typography>
          <Typography variant="body2" color="text.secondary">Start an instant meeting or schedule one. Meetings don’t create chats.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)} sx={{ borderRadius: `${radii.md}px`, boxShadow: shadows.glow }}>New meeting</Button>
      </Box>

      {!meetings.length ? (
        <EmptyState icon={VideoCallRoundedIcon} title="No meetings yet" description="Create an instant meeting for now, or schedule one for later. In-meeting chat stays inside the meeting." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>New meeting</Button>} />
      ) : (
        <Stack spacing={1.5}>
          {meetings.map((m) => (
            <Card key={m.code || m._id} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', '&:last-child': { pb: 2 } }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#fff', flexShrink: 0 }}>
                  {m.type === 'scheduled' ? <EventRoundedIcon /> : <VideoCallRoundedIcon />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{m.title || 'Meeting'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {m.type === 'scheduled' ? `Starts ${fmt(m.startsAt)}` : 'Instant meeting'} · Code {m.code}
                  </Typography>
                </Box>
                <Chip size="small" label={m.status} color={m.status === 'live' ? 'success' : m.status === 'scheduled' ? 'primary' : 'default'} variant="outlined" />
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<LinkRoundedIcon />} onClick={() => copyLink(m.code)}>Copy link</Button>
                  <Button size="small" variant="contained" disabled={!canJoin(m)} onClick={() => history.push(`/meeting/${m.code}`)}>{m.type === 'scheduled' && !canJoin(m) ? 'Not started' : 'Join'}</Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => !creating && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New meeting</DialogTitle>
        <DialogContent>
          <Tabs value={mode} onChange={(e, v) => setMode(v)} sx={{ mb: 2 }}>
            <Tab value="instant" label="Instant" />
            <Tab value="scheduled" label="Schedule" />
          </Tabs>
          <TextField fullWidth label="Meeting title" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2 }} />
          {mode === 'scheduled' ? (
            <TextField fullWidth type="datetime-local" label="Start time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} InputLabelProps={{ shrink: true }} helperText="You can join only when the start time arrives." />
          ) : (
            <Typography variant="body2" color="text.secondary">Creates a meeting link now. No chat thread is created.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setOpen(false)} disabled={creating}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>{mode === 'instant' ? 'Start meeting' : 'Schedule'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Meetings;
