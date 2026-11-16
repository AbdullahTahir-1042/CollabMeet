const router = require('express').Router();
const auth = require('../middleware/auth');
const Notification = require('../models/notification');

router.get('/', auth, async (req, res) => {
  try {
    const items = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100);
    res.json(items.map((n) => ({ _id: n._id.toString(), type: n.type, title: n.title, body: n.body, refType: n.refType, refId: n.refId, readAt: n.readAt, createdAt: n.createdAt, meta: n.meta || {} })));
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { readAt: new Date() }, { new: true });
    if (!n) return res.status(404).json({ message: 'Not found.' });
    res.json({ _id: n._id.toString(), readAt: n.readAt });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, readAt: null }, { readAt: new Date() });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;
