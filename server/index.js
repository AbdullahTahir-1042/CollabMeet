const express = require('express');
const app = express();
const server = require('http').createServer(app);
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

const userRoute = require('./routes/users');
const authRoute = require('./routes/auth');
const dmRoute = require('./routes/dms');
const meetingRoute = require('./routes/meetings');
const notificationRoute = require('./routes/notifications');
const conversationRoute = require('./routes/conversation');
const messageRoute = require('./routes/message');

const socketAuth = require('./middleware/socketAuth');
const MeetingMessage = require('./models/meetingMessage');
const User = require('./models/user');
const { findMeetingByCode } = require('./utils/meeting');

dotenv.config();

mongoose
  .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  .then(() => console.log('Connected to Mongo DB.'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
io.use(socketAuth);

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('common'));

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/dms', dmRoute);
app.use('/api/meetings', meetingRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/conversations', conversationRoute);
app.use('/api/messages', messageRoute);

const rooms = {}; // roomId -> [{ socketId, userId, name }]
const userRoomPairs = {}; // socketId -> roomId
const MAX_PARTICIPANTS = 4;

const cleanupMeeting = async (roomId) => {
  try {
    const meeting = await findMeetingByCode(roomId);
    if (!meeting) return;
    if (meeting.status !== 'ended') {
      meeting.status = 'ended';
      meeting.endedAt = new Date();
      await meeting.save();
    }
    await MeetingMessage.deleteMany({ meetingId: meeting._id });
  } catch (e) {
    // ignore cleanup errors
  }
};

io.on('connection', (socket) => {
  socket.emit('me', socket.id);
  if (socket.userId) socket.join(`user:${socket.userId}`);

  socket.on('user-wants-to-join', async (roomId) => {
    try {
      const meeting = await findMeetingByCode(roomId);
      if (meeting && meeting.type === 'scheduled' && meeting.startsAt && Date.now() < new Date(meeting.startsAt).getTime()) {
        socket.emit('join-response', { count: 0, blocked: true, reason: 'Meeting has not started yet.' });
        return;
      }
      if (meeting && ['ended', 'cancelled'].includes(meeting.status)) {
        socket.emit('join-response', { count: 0, blocked: true, reason: 'Meeting has ended.' });
        return;
      }
    } catch (e) {}
    const count = rooms[roomId]?.length || 0;
    if (count >= MAX_PARTICIPANTS) {
      socket.emit('join-response', { count, full: true });
      return;
    }
    socket.emit('join-response', { count, full: false });
  });

  socket.on('meeting:join', (code) => {
    if (code) socket.join(`meeting:${code}`);
  });

  socket.on('meeting:leave', (code) => {
    if (code) socket.leave(`meeting:${code}`);
  });

  socket.on('user-joined', async ({ roomId, userId, name }) => {
    if (!roomId) return;
    if (!rooms[roomId]) rooms[roomId] = [];
    if (rooms[roomId].length >= MAX_PARTICIPANTS && !rooms[roomId].some((u) => u.socketId === socket.id)) {
      socket.emit('call-full');
      return;
    }
    const displayName = name || (socket.userId ? (await User.findById(socket.userId).select('name'))?.name : null) || 'Guest';
    if (!rooms[roomId].some((u) => u.socketId === socket.id)) {
      rooms[roomId].push({ socketId: socket.id, userId: socket.userId || userId, name: displayName, handRaised: false });
    }
    userRoomPairs[socket.id] = roomId;
    socket.join(`meeting:${roomId}`);

    const existing = rooms[roomId].filter((u) => u.socketId !== socket.id).map((u) => ({ socketId: u.socketId, name: u.name, handRaised: !!u.handRaised }));
    socket.emit('all-users', existing);
    socket.to(`meeting:${roomId}`).emit('user-joined-room', { socketId: socket.id, name: displayName, handRaised: false });
  });

  socket.on('sending-signal', ({ userToSignal, callerId, signal, name }) => {
    io.to(userToSignal).emit('user-signal', { signal, callerId, name });
  });

  socket.on('returning-signal', ({ callerId, signal }) => {
    io.to(callerId).emit('receiving-returned-signal', { signal, id: socket.id });
  });

  socket.on('leave-call', async (roomId) => {
    const room = rooms[roomId];
    if (room) {
      const idx = room.findIndex((u) => u.socketId === socket.id);
      if (idx !== -1) {
        room.splice(idx, 1);
        socket.to(`meeting:${roomId}`).emit('user-left', socket.id);
      }
      if (room.length === 0) {
        delete rooms[roomId];
        await cleanupMeeting(roomId);
      }
    }
    socket.leave(`meeting:${roomId}`);
    delete userRoomPairs[socket.id];
  });

  socket.on('disconnect', async () => {
    const roomId = userRoomPairs[socket.id];
    const room = roomId ? rooms[roomId] : null;
    if (room) {
      const idx = room.findIndex((u) => u.socketId === socket.id);
      if (idx !== -1) {
        room.splice(idx, 1);
        socket.to(`meeting:${roomId}`).emit('user-left', socket.id);
      }
      if (room.length === 0) {
        delete rooms[roomId];
        await cleanupMeeting(roomId);
      }
    }
    delete userRoomPairs[socket.id];
  });

  // legacy 1:1 handlers (kept for compatibility)
  socket.on('callUser', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('callUser', { signal: signalData, from, name });
  });
  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', { signal: data.signal, name: data.from, from: data.to });
  });
  socket.on('declineCall', (to) => io.to(to).emit('callDeclined'));

  socket.on('hand-raised', (roomId) => {
    const room = rooms[roomId];
    const me = room?.find((u) => u.socketId === socket.id);
    if (me) me.handRaised = true;
    socket.to(`meeting:${roomId}`).emit('hand-update', { socketId: socket.id, handRaised: true });
  });

  socket.on('hand-lowered', (roomId) => {
    const room = rooms[roomId];
    const me = room?.find((u) => u.socketId === socket.id);
    if (me) me.handRaised = false;
    socket.to(`meeting:${roomId}`).emit('hand-update', { socketId: socket.id, handRaised: false });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
