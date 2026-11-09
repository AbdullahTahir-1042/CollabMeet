const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const secret = process.env.JWT_SECRET;

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated.' });

    const decodedData = jwt.verify(token, secret);
    req.userId = decodedData?.id;
    if (!req.userId) return res.status(401).json({ message: 'Not authenticated.' });

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
};

module.exports = auth;