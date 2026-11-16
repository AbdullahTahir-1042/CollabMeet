const router = require('express').Router();
const auth = require('../middleware/auth');
const Meeting = require('../models/meeting');
const MeetingMessage = require('../models/meetingMessage');
const User = require('../models/user');
const { generateCode, findMeetingByCode, canJoinScheduled, meetingForClient } = require('../utils/meeting');
const { createAndEmit } = require('../utils/notify');

router.post('/instant', auth, async (req, res) => {
  try {
    const title = (req.body.title || '').toString().trim() || 'Instant meeting';
    const code = await generateCode();
    const meeting = await Meeting.create({ type: 'instant', title, code, hostId: req.userId, status: 'live', startedAt: new Date() });
    res.status(201).json(meetingForClient(meeting));
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/scheduled', auth, async (req, res) => {
  try {
    const title = (req.body.title || '').toString().trim() || 'Scheduled meeting';
    const startsAt = req.body.startsAt ? new Date(req.body.startsAt) : null;
    if (!startsAt || Number.isNaN(startsAt.getTime())) return res.status(400).json({ message: 'Valid start time is required.' });
    if (startsAt.getTime() <= Date.now()) return res.status(400).json({ message: 'Start time must be in the future.' });
    const endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;
    const code = await generateCode();
    const meeting = await Meeting.create({ type: 'scheduled', title, code, hostId: req.userId, status: 'scheduled', startsAt, endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : undefined });
    res.status(201).json(meetingForClient(meeting));
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({ hostId: req.userId }).sort({ startsAt: -1, createdAt: -1 }).limit(100);
    res.json(meetings.map(meetingForClient));
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.get('/:code', auth, async (req, res) => {
  try {
    const meeting = await findMeetingByCode(req.params.code);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });
    const host = await User.findById(meeting.hostId).select('name email');
    res.json({ ...meetingForClient(meeting), host: host ? { _id: host._id.toString(), name: host.name } : null, canJoin: canJoinScheduled(meeting) });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/:code/join', auth, async (req, res) => {
  try {
    const meeting = await findMeetingByCode(req.params.code);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });
    if (!canJoinScheduled(meeting)) return res.status(403).json({ message: 'Meeting has not started yet.' });
    if (['ended', 'cancelled'].includes(meeting.status)) return res.status(409).json({ message: 'Meeting has ended.' });
    if (meeting.type === 'scheduled' && meeting.status === 'scheduled') {
      meeting.status = 'live';
      meeting.startedAt = new Date();
      await meeting.save();
    }
    res.json({ ...meetingForClient(meeting), canJoin: true });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/:code/end', auth, async (req, res) => {
  try {
    const meeting = await findMeetingByCode(req.params.code);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });
    if (meeting.hostId?.toString() !== req.userId?.toString()) return res.status(403).json({ message: 'Forbidden.' });
    meeting.status = 'ended';
    meeting.endedAt = new Date();
    await meeting.save();
    await MeetingMessage.deleteMany({ meetingId: meeting._id }); // deleted when meeting ends per product decision
    res.json(meetingForClient(meeting));
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.get('/:code/messages', auth, async (req, res) => {
  try {
    const meeting = await findMeetingByCode(req.params.code);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });
    if (!canJoinScheduled(meeting)) return res.status(403).json({ message: 'Meeting has not started yet.' });
    if (meeting.status === 'ended' || meeting.status === 'cancelled') return res.json([]);
    const messages = await MeetingMessage.find({ meetingId: meeting._id }).sort({ createdAt: 1 }).limit(500);
    res.json(messages.map((m) => ({ _id: m._id.toString(), meetingId: m.meetingId.toString(), senderId: m.senderId.toString(), senderName: m.senderName, text: m.text, createdAt: m.createdAt })));
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/:code/messages', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const meeting = await findMeetingByCode(req.params.code);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });
    if (!canJoinScheduled(meeting)) return res.status(403).json({ message: 'Meeting has not started yet.' });
    if (['ended', 'cancelled'].includes(meeting.status)) return res.status(409).json({ message: 'Meeting has ended.' });
    const text = (req.body.text || '').toString().trim();
    if (!text) return res.status(400).json({ message: 'Message is required.' });
    const user = await User.findById(req.userId).select('name');
    const msg = await MeetingMessage.create({ meetingId: meeting._id, senderId: req.userId, senderName: user?.name || 'Guest', text });
    const payload = { _id: msg._id.toString(), meetingId: msg.meetingId.toString(), senderId: msg.senderId.toString(), senderName: msg.senderName, text: msg.text, createdAt: msg.createdAt };
    if (io) io.to(`meeting:${meeting.code || meeting._id.toString()}`).emit('meeting:chat:message', payload);
    res.status(201).json(payload);
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
