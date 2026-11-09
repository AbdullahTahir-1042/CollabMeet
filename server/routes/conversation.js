const router = require('express').Router();
const auth = require('../middleware/auth');

// legacy endpoints retired (fresh DM/meeting model)
router.use(auth);
router.get('/', (req, res) => res.json([]));
router.post('/', (req, res) => res.status(410).json({ message: 'Use meetings or chats.' }));
router.get('/:chatId', (req, res) => res.status(410).json({ message: 'Use meetings or chats.' }));

module.exports = router;