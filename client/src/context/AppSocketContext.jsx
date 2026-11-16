import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { NOTIFY_RECEIVE } from '../reducer/notifications';
import { DM_REQUEST_RECEIVED, DM_ACCEPTED } from '../reducer/dms';

const AppSocketContext = createContext({ socket: null });

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem('profile'))?.token || null;
  } catch (e) {
    return null;
  }
};

export const AppSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const socket = useMemo(() => {
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000/', { autoConnect: false, auth: { token: getToken() } });
    }
    return socketRef.current;
  }, []);

  useEffect(() => {
    const profile = localStorage.getItem('profile');
    if (!profile) return undefined;

    socket.auth = { token: getToken() };
    if (!socket.connected) socket.connect();

    const onNotification = (payload) => {
      if (!payload) return;
      dispatch({ type: NOTIFY_RECEIVE, payload });
      if (payload.type === 'dm_request') {
        dispatch({ type: DM_REQUEST_RECEIVED });
        enqueueSnackbar('New message request', { variant: 'info' });
      } else if (payload.type === 'dm_accepted') {
        dispatch({ type: DM_ACCEPTED });
        enqueueSnackbar('Message request accepted', { variant: 'success' });
      } else if (payload.type === 'dm_message') {
        enqueueSnackbar(payload.body ? `New message: ${payload.body}` : 'New message', { variant: 'info' });
      }
    };

    socket.on('notification:new', onNotification);

    return () => {
      socket.off('notification:new', onNotification);
    };
  }, [dispatch, enqueueSnackbar, socket]);

  return <AppSocketContext.Provider value={{ socket }}>{children}</AppSocketContext.Provider>;
};

export const useAppSocket = () => useContext(AppSocketContext);
