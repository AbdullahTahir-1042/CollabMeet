import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { useSnackbar } from 'notistack';

import sound from './assets/ding.mp3';

const SocketContext = createContext();

const getRoomCode = () => {
  const hash = window.location.hash || '';
  return hash.replace('#/video-call/', '').replace('#/meeting/', '').split('?')[0].split('/')[0];
};

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem('profile'))?.token || null;
  } catch (e) {
    return null;
  }
};

const getProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('profile'));
  } catch (e) {
    return null;
  }
};

const socket = io('http://localhost:5000/', { auth: { token: getToken() }, autoConnect: false });

const ContextProvider = ({ children }) => {
  const [user] = useState(getProfile());
  const [stream, setStream] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [me, setMe] = useState('');
  const [callStarted, setCallStarted] = useState(false);
  const [callJoined, setCallJoined] = useState(false); // true after joining room
  const [callAccepted, setCallAccepted] = useState(false); // at least one peer connected
  const [callEnded, setCallEnded] = useState(false);
  const [callFull, setCallFull] = useState(false);
  const [joinBlocked, setJoinBlocked] = useState('');
  const [name, setName] = useState('');
  const [chatVisibility, setChatVisibility] = useState(false);
  const [participantsVisible, setParticipantsVisible] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [messagesVersion, setMessagesVersion] = useState(0);
  const [participantsVersion, setParticipantsVersion] = useState(0);
  const [peers, setPeers] = useState([]); // [{ socketId, name, handRaised, stream }]

  const roomId = useRef(getRoomCode());
  const myVideo = useRef();
  const peersRef = useRef({}); // socketId -> Peer
  const peerMetaRef = useRef({}); // socketId -> { name, handRaised, stream }
  const messageRef = useRef([]);
  const joiningRef = useRef(false);
  const streamRef = useRef(null);
  const audio = useRef(new Audio(sound));

  const location = useLocation();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  const playDing = () => {
    const playback = audio.current?.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  };

  const syncPeers = useCallback(() => {
    const list = Object.entries(peerMetaRef.current).map(([socketId, meta]) => ({
      socketId,
      name: meta.name || 'Guest',
      handRaised: !!meta.handRaised,
      stream: meta.stream || null,
    }));
    setPeers(list);
    setParticipantsVersion((v) => v + 1);
    setCallAccepted(list.length > 0);
  }, []);

  const destroyPeer = useCallback((socketId) => {
    if (peersRef.current[socketId]) {
      try { peersRef.current[socketId].destroy(); } catch (e) {}
      delete peersRef.current[socketId];
    }
    if (peerMetaRef.current[socketId]) delete peerMetaRef.current[socketId];
    syncPeers();
  }, [syncPeers]);

  const wirePeer = useCallback((peer, socketId, meta = {}) => {
    peerMetaRef.current[socketId] = { ...(peerMetaRef.current[socketId] || {}), ...meta };
    peer.on('stream', (remoteStream) => {
      peerMetaRef.current[socketId] = { ...(peerMetaRef.current[socketId] || {}), stream: remoteStream };
      syncPeers();
    });
    peer.on('data', (data) => {
      try {
        const str = new TextDecoder('utf-8').decode(data);
        const obj = JSON.parse(str);
        messageRef.current.push(obj);
        setMessagesVersion((v) => v + 1);
        playDing();
      } catch (e) {}
    });
    peer.on('close', () => destroyPeer(socketId));
    peer.on('error', () => destroyPeer(socketId));
  }, [destroyPeer, syncPeers]);

  const createPeer = useCallback((userToSignal, callerId, meta) => {
    const peer = new Peer({ initiator: true, trickle: false, stream: streamRef.current });
    peersRef.current[userToSignal] = peer;
    wirePeer(peer, userToSignal, meta);
    peer.on('signal', (signal) => {
      socket.emit('sending-signal', { userToSignal, callerId, signal, name: name || user?.result?.name || 'Guest' });
    });
    return peer;
  }, [name, user?.result?.name, wirePeer]);

  const addPeer = useCallback((incomingSignal, callerId, meta) => {
    if (peersRef.current[callerId]) {
      try { peersRef.current[callerId].signal(incomingSignal); } catch (e) {}
      return peersRef.current[callerId];
    }
    const peer = new Peer({ initiator: false, trickle: false, stream: streamRef.current });
    peersRef.current[callerId] = peer;
    wirePeer(peer, callerId, meta);
    peer.on('signal', (signal) => {
      socket.emit('returning-signal', { signal, callerId });
    });
    try { peer.signal(incomingSignal); } catch (e) {}
    return peer;
  }, [wirePeer]);

  useEffect(() => {
    if (!user?.token) {
      history.push(`/auth?redirect=${encodeURIComponent(window.location.hash.replace('#', '') || `/meeting/${getRoomCode()}`)}`);
      return undefined;
    }

    const displayName = user?.result?.name || 'Guest';
    setName(displayName);
    roomId.current = getRoomCode();

    const media = navigator.mediaDevices;
    let mounted = true;
    if (media?.getUserMedia) {
      media.getUserMedia({ video: true, audio: true })
        .then((currentStream) => {
          if (!mounted) return;
          currentStream.getAudioTracks().forEach((t) => { t.enabled = false; });
          currentStream.getVideoTracks().forEach((t) => { t.enabled = false; });
          setStream(currentStream);
          setVideoStream(currentStream);
          setMicOn(false);
          setCameraOn(false);
          if (myVideo.current) myVideo.current.srcObject = currentStream;
        })
        .catch(() => {
          if (!mounted) return;
          setStream(null);
          setVideoStream(null);
        });
    }

    socket.auth = { token: getToken() };
    if (!socket.connected) socket.connect();
    socket.emit('meeting:join', roomId.current);

    const onMe = (id) => setMe(id);
    const onAllUsers = (users) => {
      setCallJoined(true);
      (users || []).forEach((u) => {
        if (!u?.socketId || u.socketId === socket.id) return;
        if (!peersRef.current[u.socketId]) createPeer(u.socketId, socket.id, { name: u.name, handRaised: u.handRaised });
      });
      syncPeers();
    };
    const onUserJoined = ({ socketId, name: n, handRaised: hr }) => {
      if (socketId && socketId !== socket.id) {
        peerMetaRef.current[socketId] = { ...(peerMetaRef.current[socketId] || {}), name: n, handRaised: hr };
        syncPeers();
      }
    };
    const onUserSignal = ({ signal, callerId, name: n }) => {
      addPeer(signal, callerId, { name: n });
      syncPeers();
    };
    const onReturned = ({ signal, id }) => {
      if (peersRef.current[id]) {
        try { peersRef.current[id].signal(signal); } catch (e) {}
      }
    };
    const onUserLeft = (socketId) => destroyPeer(socketId);
    const onHand = ({ socketId, handRaised: hr }) => {
      if (peerMetaRef.current[socketId]) {
        peerMetaRef.current[socketId].handRaised = !!hr;
        syncPeers();
      }
    };
    const onFull = () => { joiningRef.current = false; setCallFull(true); };

    socket.on('me', onMe);
    socket.on('all-users', onAllUsers);
    socket.on('user-joined-room', onUserJoined);
    socket.on('user-signal', onUserSignal);
    socket.on('receiving-returned-signal', onReturned);
    socket.on('user-left', onUserLeft);
    socket.on('hand-update', onHand);
    socket.on('call-full', onFull);

    return () => {
      mounted = false;
      socket.emit('meeting:leave', roomId.current);
      socket.off('me', onMe);
      socket.off('all-users', onAllUsers);
      socket.off('user-joined-room', onUserJoined);
      socket.off('user-signal', onUserSignal);
      socket.off('receiving-returned-signal', onReturned);
      socket.off('user-left', onUserLeft);
      socket.off('hand-update', onHand);
      socket.off('call-full', onFull);
    };
  }, [addPeer, createPeer, destroyPeer, history, location, syncPeers, user?.result?.name, user?.token]);

  useEffect(() => { streamRef.current = stream; }, [stream]);

  useEffect(() => () => {
    Object.values(peersRef.current).forEach((p) => { try { p.destroy(); } catch (e) {} });
    peersRef.current = {};
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    socket.emit('leave-call', roomId.current);
  }, []);

  const startCall = () => {
    if (!stream) {
      enqueueSnackbar('Allow camera and microphone access to join the call', { variant: 'warning' });
      return;
    }
    if (joiningRef.current) return;
    joiningRef.current = true;
    setJoinBlocked(''); /* declined not used in mesh */ setCallEnded(false); setCallFull(false);

    const onJoinResponse = (payload) => {
      socket.off('join-response', onJoinResponse);
      const obj = payload && typeof payload === 'object' ? payload : { count: payload };
      if (obj.blocked) { joiningRef.current = false; setJoinBlocked(obj.reason || 'Meeting is not available.'); return; }
      if (obj.full || (obj.count || 0) >= 4) { joiningRef.current = false; setCallFull(true); return; }
      setCallStarted(true);
      socket.emit('user-joined', { userId: socket.id, roomId: roomId.current, name: name || user?.result?.name || 'Guest' });
      joiningRef.current = false;
    };
    socket.on('join-response', onJoinResponse);
    socket.emit('user-wants-to-join', roomId.current);
  };

  const leaveCall = () => {
    joiningRef.current = false;
    setCallEnded(true);
    Object.values(peersRef.current).forEach((p) => { try { p.destroy(); } catch (e) {} });
    peersRef.current = {};
    peerMetaRef.current = {};
    if (stream) stream.getTracks().forEach((t) => t.stop());
    history.push('/meetings');
  };

  const handleHand = (state) => {
    setHandRaised(state);
    socket.emit(state ? 'hand-raised' : 'hand-lowered', roomId.current);
  };

  const participants = useMemo(() => [
    { name: name || user?.result?.name || 'You', handRaised, self: true, socketId: me || 'self' },
    ...peers.map((p) => ({ name: p.name, handRaised: p.handRaised, self: false, socketId: p.socketId })),
  ], [handRaised, me, name, peers, user?.result?.name]);

  return (
    <SocketContext.Provider value={{
      call: {}, callAccepted, callStarted, setCallStarted, callJoined, callFull, callDeclined: false,
      joinBlocked, setCallJoined, myVideo, userVideo: myVideo, peersRef, messageRef,
      participantsRef: { current: participants }, participants, peers, remoteStreams: peers,
      stream, videoStream, micOn, setMicOn, cameraOn, setCameraOn, chatVisibility, setChatVisibility, participantsVisible, setParticipantsVisible,
      messagesVersion, participantsVersion, handleHand, setHandRaised, handRaised, name, setName,
      callEnded, me, startCall, callUser: () => {}, leaveCall, declineCall: () => {}, answerCall: () => {},
      socket,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext, socket };
