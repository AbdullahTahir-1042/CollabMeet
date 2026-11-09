const router = require('express').Router();
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => res.status(410).json({ message: 'Use DM or meeting chat endpoints.' }));

module.exports = router;