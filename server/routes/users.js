const User = require('../models/user');
const auth = require('../middleware/auth');
const router = require('express').Router();

// search users for starting a DM
router.get('/search', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (q.length < 2) return res.json([]);
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [{ name: rx }, { email: rx }],
    })
      .select('name email')
      .limit(20);
    res.json(users.map((u) => ({ _id: u._id.toString(), name: u.name, email: u.email })));
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// legacy no-op for old clients
router.post('/:chatId', auth, async (req, res) => {
  res.json({ ok: true });
});

module.exports = router;