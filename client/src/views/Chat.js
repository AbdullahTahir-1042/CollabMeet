import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, List, ListItemButton, ListItemAvatar, ListItemText,
  Skeleton, Stack, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import { useSnackbar } from 'notistack';

import UserAvatar from '../components/ui/UserAvatar';
import Message from '../components/Message';
import ChatComposer from '../components/ChatComposer';
import EmptyState from '../components/ui/EmptyState';
import SkeletonList from '../components/ui/SkeletonList';
import { searchUsers } from '../api/index';
import { fetchDms, fetchDmRequests, fetchDmThread, sendDm, startNewDm, acceptDm, declineDm } from '../actions/dms';
import { fetchNotifications } from '../actions/notifications';
import { staggerContainer } from '../styles/variants';
import { radii, shadows } from '../styles/tokens';

const MessageSkeleton = () => (
  <Stack spacing={2} sx={{ py: 2 }}>
    {[0, 1, 2, 3].map((row) => (
      <Box key={row} sx={{ display: 'flex', justifyContent: row % 2 === 0 ? 'flex-start' : 'flex-end' }}>
        <Skeleton variant="rounded" width={row % 2 === 0 ? '48%' : '38%'} height={row % 3 === 0 ? 64 : 44} sx={{ borderRadius: 3 }} />
      </Box>
    ))}
  </Stack>
);

const profile = () => { try { return JSON.parse(localStorage.getItem('profile')); } catch (e) { return null; } };

const Chat = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useMediaQuery('(max-width:899px)');
  const user = profile();
  const myId = user?.result?._id;

  const { items: threads, requests, requestVersion } = useSelector((s) => s.dms || { items: [], requests: [] });

  const [tab, setTab] = useState('chats');
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState(() => localStorage.getItem('selectedDmId') || '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [threadData, setThreadData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [firstMessage, setFirstMessage] = useState('');
  const [startingDm, setStartingDm] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => { if (!user?.token) history.push('/auth'); }, [history, user?.token]);

  const loadLists = useCallback(async () => {
    if (!user?.token) return;
    setLoadingList(true);
    await Promise.all([dispatch(fetchDms()), dispatch(fetchDmRequests()), dispatch(fetchNotifications())]);
    setLoadingList(false);
  }, [dispatch, user?.token]);

  useEffect(() => { loadLists(); }, [loadLists, requestVersion]);

  useEffect(() => {
    if (!currentThreadId) { setThreadData(null); setMessages([]); return undefined; }
    let cancelled = false;
    setLoadingThread(true);
    dispatch(fetchDmThread(currentThreadId)).then((data) => {
      if (cancelled) return;
      if (data) { setThreadData(data.thread || null); setMessages(Array.isArray(data.messages) ? data.messages : []); }
    }).finally(() => { if (!cancelled) setLoadingThread(false); });
    return () => { cancelled = true; };
  }, [currentThreadId, dispatch]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length, currentThreadId]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = userQuery.trim();
      if (q.length < 2) { setUserResults([]); return; }
      setSearchingUsers(true);
      try { const { data } = await searchUsers(q); setUserResults(Array.isArray(data) ? data : []); }
      catch (e) { setUserResults([]); }
      finally { setSearchingUsers(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [userQuery]);

  const activeThreads = useMemo(() => (threads || []).filter((t) => t && t.status === 'active').filter((t) => ((t.otherUser?.name || t.lastMessageText || '').toLowerCase().includes(search.trim().toLowerCase()))), [threads, search]);
  const pendingOutgoing = useMemo(() => (threads || []).filter((t) => t && t.status === 'pending' && t.isRequester), [threads]);

  const current = threadData || (threads || []).find((t) => t._id === currentThreadId) || (requests || []).find((t) => t._id === currentThreadId);
  const isRequest = current?.status === 'pending' && current?.isRecipient;
  const isPendingOutgoing = current?.status === 'pending' && current?.isRequester;

  const selectThread = (id) => { setCurrentThreadId(id); localStorage.setItem('selectedDmId', id); if (isMobile) setMobileOpen(true); };

  const groupedMessages = useMemo(() => messages.map((message, index) => {
    const previous = messages[index - 1];
    const sameSender = previous && message.senderId && previous.senderId === message.senderId;
    const withinWindow = previous && message.createdAt && previous.createdAt && new Date(message.createdAt) - new Date(previous.createdAt) < 5 * 60 * 1000;
    return { message, showHeader: !(sameSender && withinWindow), showDay: !previous || !previous.createdAt || new Date(message.createdAt).toDateString() !== new Date(previous.createdAt).toDateString(), own: message.senderId === myId };
  }), [messages, myId]);

  const handleSend = async () => {
    const text = msg.trim();
    if (!text || !currentThreadId || sending || isRequest) return;
    const optimistic = { _id: `temp-${Date.now()}`, text, senderId: myId, senderName: user?.result?.name, createdAt: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, optimistic]);
    setMsg(''); setSending(true);
    try {
      const data = await dispatch(sendDm(currentThreadId, { text }));
      if (!data?.message) {
        setMessages((prev) => prev.filter((m) => m._id !== optimistic._id)); setMsg(text);
        enqueueSnackbar(data?.message || 'Could not send message', { variant: 'error' });
      } else {
        setMessages((prev) => [...prev.filter((m) => m._id !== optimistic._id), data.message]);
        if (data.thread) setThreadData(data.thread);
        dispatch(fetchDms());
      }
    } finally { setSending(false); }
  };

  const handleStartDm = async () => {
    if (!selectedUser || !firstMessage.trim() || startingDm) return;
    setStartingDm(true);
    try {
      const data = await dispatch(startNewDm({ recipientId: selectedUser._id, text: firstMessage.trim() }));
      if (data?.thread) {
        setNewChatOpen(false); setSelectedUser(null); setUserQuery(''); setUserResults([]); setFirstMessage('');
        await loadLists();
        selectThread(data.thread._id);
        enqueueSnackbar(data.thread.status === 'pending' ? 'Message request sent' : 'Message sent', { variant: 'success' });
      } else {
        enqueueSnackbar(data?.message || 'Could not start chat', { variant: 'error' });
      }
    } finally { setStartingDm(false); }
  };

  const handleAccept = async () => {
    if (!currentThreadId) return;
    const data = await dispatch(acceptDm(currentThreadId));
    if (data?.thread) { setThreadData(data.thread); enqueueSnackbar('Request accepted', { variant: 'success' }); loadLists(); }
  };
  const handleDecline = async () => {
    if (!currentThreadId) return;
    await dispatch(declineDm(currentThreadId));
    setCurrentThreadId(''); localStorage.removeItem('selectedDmId'); setThreadData(null); setMessages([]); setMobileOpen(false);
    enqueueSnackbar('Request declined', { variant: 'info' }); loadLists();
  };

  const headerName = current?.otherUser?.name || 'Chat';

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0, position: 'relative' }}>
      {!isMobile || !mobileOpen ? (
        <Box sx={{ width: isMobile ? '100%' : 344, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'background.paper', borderRight: isMobile ? 0 : 1, borderColor: 'divider' }}>
          <Box sx={{ px: 2, pt: 2.5, pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
              <Typography variant="h4">Messages</Typography>
              <Tooltip title="New chat"><IconButton onClick={() => setNewChatOpen(true)} aria-label="New chat" sx={{ bgcolor: 'primary.main', color: '#fff', boxShadow: shadows.glow, '&:hover': { bgcolor: 'primary.dark' } }}><AddRoundedIcon /></IconButton></Tooltip>
            </Box>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ minHeight: 40, mb: 1 }}>
              <Tab value="chats" label="Chats" sx={{ minHeight: 40 }} />
              <Tab value="requests" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Requests {requests.length ? <Chip size="small" color="error" label={requests.length} /> : null}</Box>} sx={{ minHeight: 40 }} />
            </Tabs>
            {tab === 'chats' ? (
              <TextField fullWidth placeholder="Search chats" value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
            ) : null}
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 1.5, minHeight: 0 }}>
            {loadingList ? <SkeletonList rows={6} /> : tab === 'requests' ? (
              requests.length ? (
                <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible" sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {requests.map((r) => (
                    <Box key={r._id} component={motion.button} type="button" onClick={() => selectThread(r._id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', textAlign: 'left', border: 'none', bgcolor: currentThreadId === r._id ? 'action.selected' : 'transparent', cursor: 'pointer', p: 1.25, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                      <UserAvatar name={r.otherUser?.name || 'User'} size={46} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>{r.otherUser?.name || 'User'}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>{r.lastMessageText || 'Message request'}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : <EmptyState icon={InboxRoundedIcon} title="No requests" description="Message requests from people you haven't chatted with will appear here." />
            ) : (
              <>
                {pendingOutgoing.length ? <Typography variant="caption" color="text.secondary" sx={{ px: 1.25, pt: 0.5, display: 'block' }}>Pending requests</Typography> : null}
                {[...pendingOutgoing, ...activeThreads].length ? (
                  <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible" sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {[...pendingOutgoing, ...activeThreads].map((t) => (
                      <Box key={t._id} component={motion.button} type="button" onClick={() => selectThread(t._id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', textAlign: 'left', border: 'none', bgcolor: currentThreadId === t._id ? 'action.selected' : 'transparent', cursor: 'pointer', p: 1.25, borderRadius: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                        <UserAvatar name={t.otherUser?.name || 'Chat'} size={46} />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, flex: 1 }}>{t.otherUser?.name || 'Chat'}</Typography>
                            {t.status === 'pending' ? <Chip size="small" label="Requested" /> : null}
                          </Box>
                          <Typography variant="body2" color="text.secondary" noWrap>{t.status === 'pending' && t.isRequester ? 'Request sent' : (t.lastMessageText || 'No messages yet')}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : <EmptyState icon={ChatBubbleOutlineRoundedIcon} title="No chats yet" description="Start a new chat by searching for a person on CollabMeet." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setNewChatOpen(true)}>New chat</Button>} />}
              </>
            )}
          </Box>
        </Box>
      ) : null}

      {!isMobile || mobileOpen ? (
        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          {!currentThreadId ? (
            <EmptyState icon={ChatBubbleOutlineRoundedIcon} title="Your messages" description="Search for someone to start a chat. Your first message will be sent as a request." action={<Button variant="contained" startIcon={<PersonSearchRoundedIcon />} onClick={() => setNewChatOpen(true)}>New chat</Button>} sx={{ flex: 1 }} />
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 1.25, md: 2.5 }, py: 1.25, minHeight: 68, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', boxShadow: shadows.sm, zIndex: 2 }}>
                {isMobile ? <IconButton onClick={() => setMobileOpen(false)} aria-label="Back">←</IconButton> : null}
                <UserAvatar name={headerName} size={40} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>{headerName}</Typography>
                  <Typography variant="caption" color="text.secondary">{isPendingOutgoing ? 'Request sent — they will see your message in Requests.' : isRequest ? 'Message request' : 'Direct message'}</Typography>
                </Box>
              </Box>

              <Box ref={scrollRef} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: { xs: 1.5, md: 3.5 }, py: 2 }}>
                {loadingThread ? <MessageSkeleton /> : groupedMessages.length ? (
                  <AnimatePresence initial={false}>{groupedMessages.map((item, index) => <Message key={item.message._id || index} msg={item.message} own={item.own} showHeader={item.showHeader} showDay={item.showDay} />)}</AnimatePresence>
                ) : <EmptyState icon={ChatBubbleOutlineRoundedIcon} title="No messages yet" description="Send a message to start the conversation." sx={{ py: 10 }} />}
              </Box>

              {isRequest ? (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>Accept this request to reply. Until you accept, the sender won’t know if you’ve seen these messages.</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={handleAccept}>Accept</Button>
                    <Button variant="outlined" color="inherit" onClick={handleDecline}>Decline</Button>
                  </Stack>
                </Box>
              ) : (
                <ChatComposer value={msg} onChange={(e) => setMsg(e.target.value)} onSend={handleSend} disabled={sending || loadingThread} placeholder={isPendingOutgoing ? 'Send another message (request still pending)...' : 'Message...'} />
              )}
              {isPendingOutgoing ? <Typography variant="caption" color="text.secondary" sx={{ px: 2, pb: 1.5, display: 'block' }}>Request sent. You won’t see read/seen status unless they accept.</Typography> : null}
            </>
          )}
        </Box>
      ) : null}

      <Dialog open={newChatOpen} onClose={() => { if (!startingDm) { setNewChatOpen(false); setSelectedUser(null); setUserQuery(''); setUserResults([]); setFirstMessage(''); } }} maxWidth="sm" fullWidth>
        <DialogTitle>New chat</DialogTitle>
        <DialogContent>
          {!selectedUser ? (
            <>
              <TextField autoFocus fullWidth label="Search people" placeholder="Name or email" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} sx={{ mt: 0.5 }} />
              <List sx={{ mt: 1, maxHeight: 320, overflowY: 'auto' }}>
                {searchingUsers ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={22} /></Box> : userResults.length ? userResults.map((u) => (
                  <ListItemButton key={u._id} onClick={() => setSelectedUser(u)}>
                    <ListItemAvatar><UserAvatar name={u.name} size={38} /></ListItemAvatar>
                    <ListItemText primary={u.name} secondary={u.email} />
                  </ListItemButton>
                )) : userQuery.trim().length >= 2 ? <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No users found.</Typography> : <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Type at least 2 characters to search.</Typography>}
              </List>
            </>
          ) : (
            <Box sx={{ mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.25, bgcolor: 'action.hover', borderRadius: 2 }}>
                <UserAvatar name={selectedUser.name} size={40} />
                <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="subtitle2">{selectedUser.name}</Typography><Typography variant="caption" color="text.secondary">{selectedUser.email}</Typography></Box>
                <Button size="small" onClick={() => setSelectedUser(null)}>Change</Button>
              </Box>
              <TextField fullWidth multiline minRows={3} label="Message" placeholder="Write a message request..." value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Your first message will be sent as a request. The recipient can accept or decline. You won’t see read/seen status unless they accept.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => { setNewChatOpen(false); setSelectedUser(null); setUserQuery(''); setUserResults([]); setFirstMessage(''); }} disabled={startingDm}>Cancel</Button>
          {selectedUser ? <Button variant="contained" onClick={handleStartDm} disabled={startingDm || !firstMessage.trim()} startIcon={startingDm ? <CircularProgress size={16} /> : <PersonSearchRoundedIcon />}>Send request</Button> : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;
