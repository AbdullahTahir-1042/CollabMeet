const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const secret = process.env.JWT_SECRET;

module.exports = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || (socket.handshake.headers?.authorization || '').replace('Bearer ', '');
    if (!token) return next(new Error('Not authenticated'));
    const decoded = jwt.verify(token, secret);
    socket.userId = decoded?.id;
    if (!socket.userId) return next(new Error('Not authenticated'));
    return next();
  } catch (e) {
    return next(new Error('Not authenticated'));
  }
};
