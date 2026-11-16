import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';

import { SocketContext, socket } from '../SocketContext';
import { getMeetingMessages, sendMeetingMessage } from '../api/index';

import Message from './Message';
import ChatComposer from './ChatComposer';
import EmptyState from './ui/EmptyState';

const roomId = () => (window.location.hash || '').replace('#/video-call/', '').replace('#/meeting/', '').split('?')[0].split('/')[0];

const MeetingChat = () => {
  useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('profile')); } catch (e) { return null; }
  }, []);
  const code = roomId();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getMeetingMessages(code);
        if (active) setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setMessages([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [code]);

  useEffect(() => {
    const onMsg = (payload) => {
      if (!payload || (payload.meetingId && payload.meetingCode && payload.meetingCode !== code)) {
        // allow by code-less payloads
      }
      setMessages((prev) => (prev.some((m) => m._id === payload._id) ? prev : [...prev, payload]));
    };
    socket.on('meeting:chat:message', onMsg);
    return () => socket.off('meeting:chat:message', onMsg);
  }, [code]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const grouped = useMemo(() => {
    const list = messages.filter(Boolean);
    return list.map((item, index) => {
      const previous = list[index - 1];
      const sameSender = previous && item.senderId && previous.senderId === item.senderId;
      const withinWindow = previous && item.createdAt && previous.createdAt && new Date(item.createdAt) - new Date(previous.createdAt) < 5 * 60 * 1000;
      const showHeader = !(sameSender && withinWindow);
      const showDay = !previous || !item.createdAt || !previous.createdAt || new Date(item.createdAt).toDateString() !== new Date(previous.createdAt).toDateString();
      return { message: item, showHeader, showDay, own: item.senderId && item.senderId === user?.result?._id };
    });
  }, [messages, user]);

  const sendUserMessage = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage('');
    try {
      await sendMeetingMessage(code, { text });
    } catch (e) {
      setMessage(text);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, minHeight: 0 }}>
        {!loading && !messages.length ? (
          <EmptyState icon={ChatBubbleOutlineRoundedIcon} title="No messages yet" description="Meeting chat is separate from DMs. Messages are removed when the meeting ends." sx={{ py: 6 }} />
        ) : (
          grouped.map((entry, index) => (
            <Message key={entry.message._id || `m-${index}`} msg={entry.message} own={entry.own} showHeader={entry.showHeader} showDay={entry.showDay} />
          ))
        )}
      </Box>
      <ChatComposer value={message} onChange={(e) => setMessage(e.target.value)} onSend={sendUserMessage} placeholder="Message the meeting..." />
    </Box>
  );
};

export default MeetingChat;
