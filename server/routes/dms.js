const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const DmThread = require('../models/dmThread');
const DmMessage = require('../models/dmMessage');
const { toId, isId, participantKey, isParticipant, dmForClient, dmMessageForClient } = require('../utils/dm');
const { createAndEmit } = require('../utils/notify');

const populateThread = (q) => q.populate('participantIds', 'name email').populate('requestedBy', 'name email').populate('requestFor', 'name email');

const preview = (text) => (text || '').toString().slice(0, 140);

router.get('/requests', auth, async (req, res) => {
  try {
    const threads = await populateThread(
      DmThread.find({ requestFor: req.userId, status: 'pending' }).sort({ updatedAt: -1 }).limit(100)
    );
    res.json(threads.map((t) => dmForClient(t, req.userId)));
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const threads = await populateThread(
      DmThread.find({ participantIds: req.userId, status: { $in: ['active', 'pending'] } }).sort({ lastMessageAt: -1, updatedAt: -1 }).limit(100)
    );
    res.json(threads.map((t) => dmForClient(t, req.userId)));
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/start', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const recipientId = req.body.recipientId;
    const text = (req.body.text || '').toString().trim();
    if (!isId(recipientId)) return res.status(400).json({ message: 'Invalid recipient.' });
    if (toId(recipientId) === toId(req.userId)) return res.status(400).json({ message: 'Cannot message yourself.' });
    if (!text) return res.status(400).json({ message: 'Message is required.' });

    const recipient = await User.findById(recipientId).select('name email');
    if (!recipient) return res.status(404).json({ message: 'User not found.' });

    const key = participantKey(req.userId, recipientId);
    let thread = await DmThread.findOne({ participantKey: key });

    if (!thread) {
      thread = await DmThread.create({
        participantIds: [req.userId, recipientId],
        participantKey: key,
        status: 'pending',
        requestedBy: req.userId,
        requestFor: recipientId,
      });
    }

    if (thread.status === 'blocked') return res.status(403).json({ message: 'Cannot send message.' });
    if (thread.status === 'declined') {
      // allow sender to try again: reset to pending for recipient
      thread.status = 'pending';
      thread.requestedBy = req.userId;
      thread.requestFor = recipientId;
      thread.declinedAt = null;
      thread.acceptedAt = null;
    }

    if (thread.status === 'pending' && toId(thread.requestFor) === toId(req.userId)) {
      return res.status(409).json({ message: 'Accept the request to reply.', threadId: toId(thread._id) });
    }

    const msg = await DmMessage.create({ threadId: thread._id, senderId: req.userId, text });
    thread.lastMessageText = preview(text);
    thread.lastMessageAt = msg.createdAt;
    thread.lastMessageSender = req.userId;
    await thread.save();

    await populateThread(thread);

    if (thread.status === 'pending' && toId(thread.requestFor) !== toId(req.userId)) {
      await createAndEmit(io, {
        userId: thread.requestFor,
        actorId: req.userId,
        type: 'dm_request',
        title: 'New message request',
        body: 'You have a new message request.',
        refType: 'dmThread',
        refId: toId(thread._id),
      });
    } else if (thread.status === 'active') {
      const otherId = (thread.participantIds || []).map((p) => toId(p?._id || p)).find((id) => id !== toId(req.userId));
      await createAndEmit(io, {
        userId: otherId,
        actorId: req.userId,
        type: 'dm_message',
        title: 'New message',
        body: preview(text),
        refType: 'dmThread',
        refId: toId(thread._id),
      });
    }

    res.status(201).json({ thread: dmForClient(thread, req.userId), message: dmMessageForClient(msg, thread, req.userId) });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.get('/:threadId/messages', auth, async (req, res) => {
  try {
    if (!isId(req.params.threadId)) return res.status(400).json({ message: 'Invalid thread.' });
    const thread = await populateThread(DmThread.findById(req.params.threadId));
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });
    if (!isParticipant(thread, req.userId)) return res.status(403).json({ message: 'Forbidden.' });
    if (thread.status === 'pending' && toId(thread.requestFor) === toId(req.userId)) {
      // recipient can view request; allowed
    }
    const messages = await DmMessage.find({ threadId: thread._id }).sort({ createdAt: 1 }).limit(500);
    res.json({ thread: dmForClient(thread, req.userId), messages: messages.map((m) => dmMessageForClient(m, thread, req.userId)) });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/:threadId/messages', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    if (!isId(req.params.threadId)) return res.status(400).json({ message: 'Invalid thread.' });
    const text = (req.body.text || '').toString().trim();
    if (!text) return res.status(400).json({ message: 'Message is required.' });
    const thread = await populateThread(DmThread.findById(req.params.threadId));
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });
    if (!isParticipant(thread, req.userId)) return res.status(403).json({ message: 'Forbidden.' });
    if (thread.status === 'blocked') return res.status(403).json({ message: 'Cannot send message.' });
    if (thread.status === 'declined') return res.status(403).json({ message: 'Request was declined.' });
    if (thread.status === 'pending' && toId(thread.requestedBy) !== toId(req.userId)) {
      return res.status(409).json({ message: 'Accept the request to reply.' });
    }

    const msg = await DmMessage.create({ threadId: thread._id, senderId: req.userId, text });
    thread.lastMessageText = preview(text);
    thread.lastMessageAt = msg.createdAt;
    thread.lastMessageSender = req.userId;
    await thread.save();

    if (thread.status === 'active') {
      const otherId = (thread.participantIds || []).map((p) => toId(p?._id || p)).find((id) => id !== toId(req.userId));
      await createAndEmit(io, {
        userId: otherId,
        actorId: req.userId,
        type: 'dm_message',
        title: 'New message',
        body: preview(text),
        refType: 'dmThread',
        refId: toId(thread._id),
      });
    } else if (thread.status === 'pending') {
      await createAndEmit(io, {
        userId: thread.requestFor,
        actorId: req.userId,
        type: 'dm_request',
        title: 'New message request',
        body: 'You have a new message request.',
        refType: 'dmThread',
        refId: toId(thread._id),
      });
    }

    res.status(201).json({ thread: dmForClient(thread, req.userId), message: dmMessageForClient(msg, thread, req.userId) });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/:threadId/accept', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    if (!isId(req.params.threadId)) return res.status(400).json({ message: 'Invalid thread.' });
    const thread = await populateThread(DmThread.findById(req.params.threadId));
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });
    if (toId(thread.requestFor) !== toId(req.userId)) return res.status(403).json({ message: 'Forbidden.' });
    if (thread.status !== 'pending') return res.json({ thread: dmForClient(thread, req.userId) });
    thread.status = 'active';
    thread.acceptedAt = new Date();
    await thread.save();
    await createAndEmit(io, {
      userId: thread.requestedBy,
      actorId: req.userId,
      type: 'dm_accepted',
      title: 'Request accepted',
      body: 'Your message request was accepted.',
      refType: 'dmThread',
      refId: toId(thread._id),
    });
    res.json({ thread: dmForClient(thread, req.userId) });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/:threadId/decline', auth, async (req, res) => {
  try {
    if (!isId(req.params.threadId)) return res.status(400).json({ message: 'Invalid thread.' });
    const thread = await populateThread(DmThread.findById(req.params.threadId));
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });
    if (toId(thread.requestFor) !== toId(req.userId)) return res.status(403).json({ message: 'Forbidden.' });
    thread.status = 'declined';
    thread.declinedAt = new Date();
    await thread.save();
    // silent to sender per product decision
    res.json({ thread: dmForClient(thread, req.userId) });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
